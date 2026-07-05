import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import sharp from "sharp";
import { getStorageImagePath, isStorageImage, resolveCourseImageUrl } from "@/lib/images";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/types";

const IMAGE_BUCKET = "course-images";
const FONT_CDN_URL =
  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notoserif/NotoSerif-Regular.ttf";

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

let fontBytesCache: Uint8Array | null = null;

async function loadFontBytes() {
  if (fontBytesCache) return fontBytesCache;

  try {
    const res = await fetch(FONT_CDN_URL);
    if (res.ok) {
      fontBytesCache = new Uint8Array(await res.arrayBuffer());
      return fontBytesCache;
    }
  } catch {
    // Fall back to bundled font for local dev.
  }

  const fontPath = path.join(
    process.cwd(),
    "node_modules/@fontsource/noto-serif/files/noto-serif-latin-400-normal.woff2",
  );
  fontBytesCache = new Uint8Array(fs.readFileSync(fontPath));
  return fontBytesCache;
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
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
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

function centerTextX(
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  boxX: number,
  boxWidth: number,
) {
  const textWidth = font.widthOfTextAtSize(text, size);
  return boxX + Math.max(0, (boxWidth - textWidth) / 2);
}

function rightTextX(
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  boxX: number,
  boxWidth: number,
) {
  const textWidth = font.widthOfTextAtSize(text, size);
  return boxX + Math.max(0, boxWidth - textWidth);
}

function formatCertificateDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return `${date.getDate()} ${MONTHS_UK[date.getMonth()]} ${date.getFullYear()} р.`;
}

export async function generateCourseCertificatePdf(input: {
  templateUrl: string;
  fullName: string;
  completedAt: string;
}) {
  const templateBytes = await fetchTemplateBytes(input.templateUrl);
  const [pngBytes, fontBytes] = await Promise.all([
    templateToPngBytes(templateBytes),
    loadFontBytes(),
  ]);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(fontBytes);
  const image = await pdfDoc.embedPng(pngBytes);

  const width = image.width;
  const height = image.height;
  const page = pdfDoc.addPage([width, height]);

  page.drawImage(image, { x: 0, y: 0, width, height });

  const name = input.fullName.trim().toLocaleUpperCase("uk-UA");
  const dateLabel = formatCertificateDate(input.completedAt);
  const nameBoxX = width * LAYOUT.nameX;
  const nameBoxWidth = width * LAYOUT.nameWidth;
  const nameSize = fitFontSize(name, font, nameBoxWidth, height * 0.036, height * 0.02);
  const nameX = centerTextX(name, font, nameSize, nameBoxX, nameBoxWidth);
  const nameY = height * (1 - LAYOUT.nameY);

  page.drawText(name, {
    x: nameX,
    y: nameY,
    size: nameSize,
    font,
    color: LAYOUT.gold,
  });

  const dateBoxX = width * LAYOUT.dateBoxX;
  const dateBoxWidth = width * LAYOUT.dateBoxWidth;
  const dateSize = fitFontSize(dateLabel, font, dateBoxWidth, height * 0.02, height * 0.013);
  const dateX = rightTextX(dateLabel, font, dateSize, dateBoxX, dateBoxWidth);
  page.drawText(dateLabel, {
    x: dateX,
    y: height * (1 - LAYOUT.dateY),
    size: dateSize,
    font,
    color: LAYOUT.cream,
  });

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
