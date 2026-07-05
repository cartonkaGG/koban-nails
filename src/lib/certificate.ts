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
  if (code >= 0x0400 && code <= 0x04ff) return "cyrillic";
  if (code >= 0x0500 && code <= 0x052f) return "cyrillic";
  return "latin";
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
    cyrillic: readFontFile([
      path.join(root, "src/assets/fonts/noto-serif-cyrillic-400-normal.woff2"),
      path.join(
        root,
        "node_modules/@fontsource/noto-serif/files/noto-serif-cyrillic-400-normal.woff2",
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

async function templateToPngBytes(templateBytes: Uint8Array) {
  return sharp(Buffer.from(templateBytes))
    .rotate()
    .resize({ width: 3508, height: 2480, fit: "inside", withoutEnlargement: true })
    .png()
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


function getDateSegments(value: string): TextSegment[] | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return [
    { text: `${date.getDate()} `, kind: "latin" },
    { text: MONTHS_UK[date.getMonth()], kind: "cyrillic" },
    { text: ` ${date.getFullYear()}`, kind: "latin" },
    { text: " р", kind: "cyrillic" },
    { text: ".", kind: "latin" },
  ];
}

function measureSegments(segments: TextSegment[], fonts: CertificateFonts, size: number) {
  return segments.reduce((sum, segment) => {
    const font = segment.kind === "latin" ? fonts.latin : fonts.cyrillic;
    return sum + font.widthOfTextAtSize(segment.text, size);
  }, 0);
}

function fitMixedSize(
  segments: TextSegment[],
  fonts: CertificateFonts,
  maxWidth: number,
  preferred: number,
  min: number,
) {
  let size = preferred;
  while (size > min && measureSegments(segments, fonts, size) > maxWidth) {
    size -= 0.5;
  }
  return size;
}

function drawSegments(
  page: ReturnType<PDFDocument["addPage"]>,
  segments: TextSegment[],
  fonts: CertificateFonts,
  startX: number,
  y: number,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  let x = startX;

  for (const segment of segments) {
    const font = segment.kind === "latin" ? fonts.latin : fonts.cyrillic;
    page.drawText(segment.text, { x, y, size, font, color });
    x += font.widthOfTextAtSize(segment.text, size);
  }
}

function drawSegmentsCentered(
  page: ReturnType<PDFDocument["addPage"]>,
  segments: TextSegment[],
  fonts: CertificateFonts,
  boxX: number,
  boxWidth: number,
  y: number,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  const totalWidth = measureSegments(segments, fonts, size);
  drawSegments(page, segments, fonts, boxX + Math.max(0, (boxWidth - totalWidth) / 2), y, size, color);
}

function drawSegmentsRightAligned(
  page: ReturnType<PDFDocument["addPage"]>,
  segments: TextSegment[],
  fonts: CertificateFonts,
  boxX: number,
  boxWidth: number,
  y: number,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  const totalWidth = measureSegments(segments, fonts, size);
  drawSegments(page, segments, fonts, boxX + Math.max(0, boxWidth - totalWidth), y, size, color);
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

  const name = input.fullName.trim().toLocaleUpperCase("uk-UA");
  const nameSegments = splitTextByFont(name);
  const nameBoxX = width * LAYOUT.nameX;
  const nameBoxWidth = width * LAYOUT.nameWidth;
  const nameSize = fitMixedSize(
    nameSegments,
    fonts.name,
    nameBoxWidth,
    height * LAYOUT.nameSizeRatio,
    height * LAYOUT.nameSizeMinRatio,
  );
  const nameY = height * (1 - LAYOUT.nameY);

  drawSegmentsCentered(
    page,
    nameSegments,
    fonts.name,
    nameBoxX,
    nameBoxWidth,
    nameY,
    nameSize,
    LAYOUT.nameColor,
  );

  const dateSegments = getDateSegments(input.completedAt);
  const dateBoxX = width * LAYOUT.dateBoxX;
  const dateBoxWidth = width * LAYOUT.dateBoxWidth;
  const dateY = height * (1 - LAYOUT.dateY);

  if (dateSegments) {
    const dateSize = fitMixedSize(
      dateSegments,
      fonts.body,
      dateBoxWidth,
      height * LAYOUT.dateSizeRatio,
      height * LAYOUT.dateSizeMinRatio,
    );
    drawSegmentsRightAligned(
      page,
      dateSegments,
      fonts.body,
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

export function certificateFileName(courseSlug: string, fullName: string) {
  const safeName = fullName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, 40);
  return `certificate-${courseSlug}-${safeName || "student"}.pdf`;
}

export function humanizeCertificateError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("certificate template") || lower.includes("download")) {
    return "Не вдалося завантажити шаблон сертифіката. Перезавантажте його в адмінці.";
  }

  if (lower.includes("font") || lower.includes("woff")) {
    return "Не вдалося завантажити шрифт для сертифіката. Спробуйте ще раз.";
  }

  if (lower.includes("input buffer") || lower.includes("unsupported") || lower.includes("sharp")) {
    return "Формат шаблону не підтримується. Завантажте PNG або JPG.";
  }

  return "Не вдалося згенерувати сертифікат";
}
