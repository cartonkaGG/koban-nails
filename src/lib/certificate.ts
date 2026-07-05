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
  /** Date sits on the right, above the QR code (see template red-line marker). */
  dateY: 0.835,
  dateBoxX: 0.54,
  dateBoxWidth: 0.34,
  gold: rgb(0.85, 0.7, 0.51),
  cream: rgb(0.92, 0.88, 0.82),
};

type FontBytesBundle = {
  cyrillic: Uint8Array;
  latin: Uint8Array;
};

type CertificateFonts = {
  cyrillic: PDFFont;
  latin: PDFFont;
};

type DateSegment = {
  text: string;
  kind: "latin" | "cyrillic";
};

let fontBytesBundle: FontBytesBundle | null = null;

function readFontFile(candidates: string[]) {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return new Uint8Array(fs.readFileSync(candidate));
    }
  }

  throw new Error(`Certificate font file not found (${candidates[0]})`);
}

function loadFontBytesBundle(): FontBytesBundle {
  if (fontBytesBundle) return fontBytesBundle;

  const root = process.cwd();
  fontBytesBundle = {
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

  return fontBytesBundle;
}

async function embedCertificateFonts(pdfDoc: PDFDocument): Promise<CertificateFonts> {
  const bundle = loadFontBytesBundle();
  pdfDoc.registerFontkit(fontkit);

  const [cyrillic, latin] = await Promise.all([
    pdfDoc.embedFont(bundle.cyrillic),
    pdfDoc.embedFont(bundle.latin),
  ]);

  return { cyrillic, latin };
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

function centerTextX(text: string, font: PDFFont, size: number, boxX: number, boxWidth: number) {
  const textWidth = font.widthOfTextAtSize(text, size);
  return boxX + Math.max(0, (boxWidth - textWidth) / 2);
}

function getDateSegments(value: string): DateSegment[] | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return [
    { text: `${date.getDate()} `, kind: "latin" },
    { text: MONTHS_UK[date.getMonth()], kind: "cyrillic" },
    { text: ` ${date.getFullYear()}`, kind: "latin" },
    { text: " р.", kind: "cyrillic" },
  ];
}

function measureSegments(segments: DateSegment[], fonts: CertificateFonts, size: number) {
  return segments.reduce((sum, segment) => {
    const font = segment.kind === "latin" ? fonts.latin : fonts.cyrillic;
    return sum + font.widthOfTextAtSize(segment.text, size);
  }, 0);
}

function fitDateSize(
  segments: DateSegment[],
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

function drawSegmentsRightAligned(
  page: ReturnType<PDFDocument["addPage"]>,
  segments: DateSegment[],
  fonts: CertificateFonts,
  boxX: number,
  boxWidth: number,
  y: number,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  const totalWidth = measureSegments(segments, fonts, size);
  let x = boxX + Math.max(0, boxWidth - totalWidth);

  for (const segment of segments) {
    const font = segment.kind === "latin" ? fonts.latin : fonts.cyrillic;
    page.drawText(segment.text, { x, y, size, font, color });
    x += font.widthOfTextAtSize(segment.text, size);
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

  const name = input.fullName.trim().toLocaleUpperCase("uk-UA");
  const nameBoxX = width * LAYOUT.nameX;
  const nameBoxWidth = width * LAYOUT.nameWidth;
  const nameSize = fitFontSize(name, fonts.cyrillic, nameBoxWidth, height * 0.036, height * 0.02);
  const nameX = centerTextX(name, fonts.cyrillic, nameSize, nameBoxX, nameBoxWidth);
  const nameY = height * (1 - LAYOUT.nameY);

  page.drawText(name, {
    x: nameX,
    y: nameY,
    size: nameSize,
    font: fonts.cyrillic,
    color: LAYOUT.gold,
  });

  const dateSegments = getDateSegments(input.completedAt);
  const dateBoxX = width * LAYOUT.dateBoxX;
  const dateBoxWidth = width * LAYOUT.dateBoxWidth;
  const dateY = height * (1 - LAYOUT.dateY);

  if (dateSegments) {
    const dateSize = fitDateSize(dateSegments, fonts, dateBoxWidth, height * 0.02, height * 0.013);
    drawSegmentsRightAligned(page, dateSegments, fonts, dateBoxX, dateBoxWidth, dateY, dateSize, LAYOUT.cream);
  } else {
    const fallback = formatDate(input.completedAt);
    const dateSize = fitFontSize(fallback, fonts.latin, dateBoxWidth, height * 0.02, height * 0.013);
    const dateX = dateBoxX + Math.max(0, dateBoxWidth - fonts.latin.widthOfTextAtSize(fallback, dateSize));
    page.drawText(fallback, {
      x: dateX,
      y: dateY,
      size: dateSize,
      font: fonts.latin,
      color: LAYOUT.cream,
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
