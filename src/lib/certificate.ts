import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import sharp from "sharp";
import { getStorageImagePath, isStorageImage, resolveCourseImageUrl } from "@/lib/images";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/types";

const IMAGE_BUCKET = "course-images";

const MONTHS_UK = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];

/** Text placement tuned for Koban Nails landscape certificate templates. */
const LAYOUT = {
  /** Fraction from top — baseline for student name (above gold underline). */
  nameY: 0.355,
  nameX: 0.08,
  nameWidth: 0.52,
  /** Date on the right sleeve area — left of the QR code. */
  dateY: 0.862,
  dateBoxX: 0.42,
  dateBoxWidth: 0.24,
  nameColor: rgb(1, 1, 1),
  dateColor: rgb(0.92, 0.88, 0.82),
  nameSizeRatio: 0.042,
  nameSizeMinRatio: 0.024,
  dateSizeRatio: 0.024,
  dateSizeMinRatio: 0.016,
};

type FontFamilyBundle = {
  cyrillic: Uint8Array;
  latin: Uint8Array;
};

type CertificateFontSets = {
  name: CertificateFonts;
  body: CertificateFonts;
};

let nameFontBytes: FontFamilyBundle | null = null;
let bodyFontBytes: FontFamilyBundle | null = null;

type TextSegment = {
  text: string;
  kind: "latin" | "cyrillic";
};

type CertificateFonts = {
  cyrillic: PDFFont;
  latin: PDFFont;
};

function fontKindForChar(char: string): "latin" | "cyrillic" {
  const code = char.codePointAt(0) ?? 0;
  // Cyrillic + extensions used in Ukrainian (incl. ґ U+0490/U+0491).
  if (code >= 0x0400 && code <= 0x052f) return "cyrillic";
  return "latin";
}

/** Normalize profile names so PDF fonts can paint them reliably. */
function sanitizeCertificateText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "")
    .replace(/[\u2018\u2019\u201A\u2032\u02BC\u02BB`´]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function splitTextByFont(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let buffer = "";
  let kind: "latin" | "cyrillic" | null = null;

  for (const char of text) {
    const nextKind = fontKindForChar(char);
    if (kind === null) {
      kind = nextKind;
      buffer = char;
      continue;
    }

    if (nextKind === kind) {
      buffer += char;
    } else {
      segments.push({ text: buffer, kind });
      buffer = char;
      kind = nextKind;
    }
  }

  if (buffer && kind) segments.push({ text: buffer, kind });
  return segments;
}

function readFontFile(candidates: string[]) {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return new Uint8Array(fs.readFileSync(candidate));
    }
  }

  throw new Error(`Certificate font file not found (${candidates[0]})`);
}

function loadNameFontBytes(): FontFamilyBundle {
  if (nameFontBytes) return nameFontBytes;

  const root = process.cwd();
  nameFontBytes = {
    cyrillic: readFontFile([
      path.join(root, "src/assets/fonts/playfair-display-cyrillic-400-normal.woff2"),
      path.join(
        root,
        "node_modules/@fontsource/playfair-display/files/playfair-display-cyrillic-400-normal.woff2",
      ),
    ]),
    latin: readFontFile([
      path.join(root, "src/assets/fonts/playfair-display-latin-400-normal.woff2"),
      path.join(
        root,
        "node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2",
      ),
    ]),
  };

  return nameFontBytes;
}

function loadBodyFontBytes(): FontFamilyBundle {
  if (bodyFontBytes) return bodyFontBytes;

  const root = process.cwd();
  bodyFontBytes = {
    // Prefer full Cyrillic subset (Ukrainian months, «р.») over cyrillic-ext — ext alone
    // can map glyphs incorrectly in pdf-lib (e.g. month name rendering as «ллллл»).
    cyrillic: readFontFile([
      path.join(root, "src/assets/fonts/noto-serif-cyrillic-400-normal.woff2"),
      path.join(
        root,
        "node_modules/@fontsource/noto-serif/files/noto-serif-cyrillic-400-normal.woff2",
      ),
      path.join(root, "src/assets/fonts/noto-serif-cyrillic-ext-400-normal.woff2"),
      path.join(
        root,
        "node_modules/@fontsource/noto-serif/files/noto-serif-cyrillic-ext-400-normal.woff2",
      ),
    ]),
    latin: readFontFile([
      path.join(root, "src/assets/fonts/noto-serif-latin-400-normal.woff2"),
      path.join(
        root,
        "node_modules/@fontsource/noto-serif/files/noto-serif-latin-400-normal.woff2",
      ),
    ]),
  };

  return bodyFontBytes;
}

async function embedCertificateFonts(pdfDoc: PDFDocument): Promise<CertificateFontSets> {
  const [nameBytes, bodyBytes] = [loadNameFontBytes(), loadBodyFontBytes()];
  pdfDoc.registerFontkit(fontkit);

  const [nameCyrillic, nameLatin, bodyCyrillic, bodyLatin] = await Promise.all([
    pdfDoc.embedFont(nameBytes.cyrillic),
    pdfDoc.embedFont(nameBytes.latin),
    pdfDoc.embedFont(bodyBytes.cyrillic),
    pdfDoc.embedFont(bodyBytes.latin),
  ]);

  return {
    name: { cyrillic: nameCyrillic, latin: nameLatin },
    body: { cyrillic: bodyCyrillic, latin: bodyLatin },
  };
}

async function fetchTemplateBytes(templateUrl: string) {
  if (isStorageImage(templateUrl)) {
    const storagePath = getStorageImagePath(templateUrl);

    try {
      const supabase = await createAdminClient();
      const { data, error } = await supabase.storage.from(IMAGE_BUCKET).download(storagePath);
      if (!error && data) {
        return new Uint8Array(await data.arrayBuffer());
      }
    } catch {
      // Fall through to public URL fetch.
    }

    const resolved = resolveCourseImageUrl(templateUrl);
    if (resolved) {
      const res = await fetch(resolved);
      if (res.ok) {
        return new Uint8Array(await res.arrayBuffer());
      }
    }

    throw new Error("Failed to download certificate template from storage");
  }

  const resolved = resolveCourseImageUrl(templateUrl);
  if (!resolved) {
    throw new Error("Certificate template URL is invalid");
  }

  const res = await fetch(resolved);
  if (!res.ok) {
    throw new Error(`Failed to load certificate template (${res.status})`);
  }

  return new Uint8Array(await res.arrayBuffer());
}

/** A4 landscape at ~300 DPI — enough for crisp print and PDF embedding. */
const CERTIFICATE_PNG_WIDTH = 3508;
const CERTIFICATE_PNG_HEIGHT = 2480;

async function templateToPngBytes(templateBytes: Uint8Array) {
  return sharp(Buffer.from(templateBytes))
    .rotate()
    .resize({
      width: CERTIFICATE_PNG_WIDTH,
      height: CERTIFICATE_PNG_HEIGHT,
      fit: "inside",
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    })
    .png({ compressionLevel: 6, adaptiveFiltering: true })
    .toBuffer();
}

function fitFontSize(
  text: string,
  font: PDFFont,
  maxWidth: number,
  preferred: number,
  min: number,
) {
  let size = preferred;
  while (size > min && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5;
  }
  return size;
}


function formatCertificateDateUk(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const month = MONTHS_UK[date.getMonth()];
  if (!month) return null;

  return `${date.getDate()} ${month} ${date.getFullYear()} р.`;
}

function getDateSegments(value: string): TextSegment[] | null {
  const formatted = formatCertificateDateUk(value);
  if (!formatted) return null;

  return splitTextByFont(formatted);
}

function fontCanEncode(font: PDFFont, text: string) {
  try {
    font.encodeText(text);
    return true;
  } catch {
    return false;
  }
}

function fontsForSegment(
  segment: TextSegment,
  primary: CertificateFonts,
  fallback: CertificateFonts,
): PDFFont[] {
  if (segment.kind === "latin") {
    return [primary.latin, fallback.latin, primary.cyrillic, fallback.cyrillic];
  }
  return [primary.cyrillic, fallback.cyrillic, primary.latin, fallback.latin];
}

function pickFontForText(text: string, fonts: PDFFont[]) {
  return fonts.find((font) => fontCanEncode(font, text)) ?? null;
}

function resolveSegment(
  segment: TextSegment,
  primary: CertificateFonts,
  fallback: CertificateFonts,
): ResolvedSegment[] {
  const fonts = fontsForSegment(segment, primary, fallback);

  const whole = pickFontForText(segment.text, fonts);
  if (whole) {
    return [{ text: segment.text, font: whole }];
  }

  const runs: ResolvedSegment[] = [];
  let buffer = "";
  let currentFont: PDFFont | null = null;

  for (const char of segment.text) {
    const font = pickFontForText(char, fonts);
    // Skip glyphs that no embedded subset can paint — never throw mid-draw.
    if (!font) continue;

    if (currentFont === null || font === currentFont) {
      currentFont = font;
      buffer += char;
      continue;
    }

    runs.push({ text: buffer, font: currentFont });
    buffer = char;
    currentFont = font;
  }

  if (buffer && currentFont) runs.push({ text: buffer, font: currentFont });
  return runs;
}

function resolveSegments(
  segments: TextSegment[],
  primary: CertificateFonts,
  fallback: CertificateFonts,
) {
  return segments.flatMap((segment) => resolveSegment(segment, primary, fallback));
}

type ResolvedSegment = {
  text: string;
  font: PDFFont;
};

function measureResolvedSegments(segments: ResolvedSegment[], size: number) {
  return segments.reduce((sum, segment) => sum + segment.font.widthOfTextAtSize(segment.text, size), 0);
}

function fitResolvedSize(
  segments: ResolvedSegment[],
  maxWidth: number,
  preferred: number,
  min: number,
) {
  let size = preferred;
  while (size > min && measureResolvedSegments(segments, size) > maxWidth) {
    size -= 0.5;
  }
  return size;
}

function drawResolvedSegments(
  page: ReturnType<PDFDocument["addPage"]>,
  segments: ResolvedSegment[],
  startX: number,
  y: number,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  let x = startX;

  for (const segment of segments) {
    page.drawText(segment.text, { x, y, size, font: segment.font, color });
    x += segment.font.widthOfTextAtSize(segment.text, size);
  }
}

function drawResolvedCentered(
  page: ReturnType<PDFDocument["addPage"]>,
  segments: ResolvedSegment[],
  boxX: number,
  boxWidth: number,
  y: number,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  const totalWidth = measureResolvedSegments(segments, size);
  drawResolvedSegments(page, segments, boxX + Math.max(0, (boxWidth - totalWidth) / 2), y, size, color);
}

function drawResolvedRightAligned(
  page: ReturnType<PDFDocument["addPage"]>,
  segments: ResolvedSegment[],
  boxX: number,
  boxWidth: number,
  y: number,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  const totalWidth = measureResolvedSegments(segments, size);
  drawResolvedSegments(page, segments, boxX + Math.max(0, boxWidth - totalWidth), y, size, color);
}

function formatCertificateName(fullName: string) {
  const trimmed = sanitizeCertificateText(fullName);
  if (!trimmed) return "";
  try {
    return trimmed.toLocaleUpperCase("uk-UA");
  } catch {
    return trimmed.toUpperCase();
  }
}

export async function generateCourseCertificatePdf(input: {
  templateUrl: string;
  fullName: string;
  completedAt: string;
}) {
  const templateBytes = await fetchTemplateBytes(input.templateUrl);
  const pngBytes = await templateToPngBytes(templateBytes);

  const pdfDoc = await PDFDocument.create();
  const fonts = await embedCertificateFonts(pdfDoc);
  const image = await pdfDoc.embedPng(pngBytes);

  const width = image.width;
  const height = image.height;
  const page = pdfDoc.addPage([width, height]);

  page.drawImage(image, { x: 0, y: 0, width, height });

  const name = formatCertificateName(input.fullName);
  if (!name) {
    throw new Error("Certificate name is empty after sanitizing");
  }

  const nameSegments = resolveSegments(splitTextByFont(name), fonts.name, fonts.body);
  if (nameSegments.length === 0) {
    throw new Error("Certificate name has no drawable characters");
  }

  const nameBoxX = width * LAYOUT.nameX;
  const nameBoxWidth = width * LAYOUT.nameWidth;
  const nameSize = fitResolvedSize(
    nameSegments,
    nameBoxWidth,
    height * LAYOUT.nameSizeRatio,
    height * LAYOUT.nameSizeMinRatio,
  );
  const nameY = height * (1 - LAYOUT.nameY);

  drawResolvedCentered(
    page,
    nameSegments,
    nameBoxX,
    nameBoxWidth,
    nameY,
    nameSize,
    LAYOUT.nameColor,
  );

  const dateSegments = resolveSegments(
    getDateSegments(input.completedAt) ?? [],
    fonts.body,
    fonts.body,
  );
  const dateBoxX = width * LAYOUT.dateBoxX;
  const dateBoxWidth = width * LAYOUT.dateBoxWidth;
  const dateY = height * (1 - LAYOUT.dateY);

  if (dateSegments.length > 0) {
    const dateSize = fitResolvedSize(
      dateSegments,
      dateBoxWidth,
      height * LAYOUT.dateSizeRatio,
      height * LAYOUT.dateSizeMinRatio,
    );
    drawResolvedRightAligned(
      page,
      dateSegments,
      dateBoxX,
      dateBoxWidth,
      dateY,
      dateSize,
      LAYOUT.dateColor,
    );
  } else {
    const fallback = formatDate(input.completedAt);
    const dateSize = fitFontSize(
      fallback,
      fonts.body.latin,
      dateBoxWidth,
      height * LAYOUT.dateSizeRatio,
      height * LAYOUT.dateSizeMinRatio,
    );
    const dateX =
      dateBoxX + Math.max(0, dateBoxWidth - fonts.body.latin.widthOfTextAtSize(fallback, dateSize));
    page.drawText(fallback, {
      x: dateX,
      y: dateY,
      size: dateSize,
      font: fonts.body.latin,
      color: LAYOUT.dateColor,
    });
  }

  return pdfDoc.save();
}

export function certificateFileName(courseSlug: string, _fullName?: string) {
  // Content-Disposition headers must be ASCII / Latin-1. Keep the download
  // name slug-only — never put Cyrillic profile names in HTTP headers.
  const safeSlug = courseSlug
    .normalize("NFKC")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `certificate-${safeSlug || "course"}.pdf`;
}

export function certificateContentDisposition(fileName: string) {
  const asciiName = fileName.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(fileName);
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encoded}`;
}

export function humanizeCertificateError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("certificate template") || lower.includes("download")) {
    return "Не вдалося завантажити шаблон сертифіката. Перезавантажте його в адмінці.";
  }

  if (lower.includes("bytestring") || lower.includes("content-disposition")) {
    return "Не вдалося віддати файл сертифіката. Спробуйте ще раз.";
  }

  if (
    lower.includes("empty after sanitizing") ||
    lower.includes("no drawable characters") ||
    lower.includes("winansi") ||
    lower.includes("encode") ||
    lower.includes("glyph")
  ) {
    return "Не вдалося записати ім'я на сертифікат. Перевірте ім'я в профілі і спробуйте знову.";
  }

  if (lower.includes("font") || lower.includes("woff")) {
    return "Не вдалося завантажити шрифт для сертифіката. Спробуйте ще раз.";
  }

  if (lower.includes("input buffer") || lower.includes("unsupported") || lower.includes("sharp")) {
    return "Формат шаблону не підтримується. Завантажте PNG або JPG.";
  }

  return "Не вдалося згенерувати сертифікат";
}
