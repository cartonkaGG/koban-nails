import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { resolveCourseImageUrl } from "@/lib/images";
import { formatDate } from "@/lib/types";

/** Text placement tuned for Koban Nails landscape certificate templates. */
const LAYOUT = {
  nameY: 0.405,
  nameX: 0.08,
  nameWidth: 0.52,
  dateX: 0.12,
  dateY: 0.875,
  gold: rgb(0.85, 0.7, 0.51),
  cream: rgb(0.92, 0.88, 0.82),
};

let fontBytesCache: Uint8Array | null = null;

function loadFontBytes() {
  if (fontBytesCache) return fontBytesCache;

  const fontPath = path.join(
    process.cwd(),
    "node_modules/@fontsource/noto-serif/files/noto-serif-cyrillic-400-normal.woff2",
  );
  fontBytesCache = new Uint8Array(fs.readFileSync(fontPath));
  return fontBytesCache;
}

async function fetchTemplateBytes(templateUrl: string) {
  const resolved = resolveCourseImageUrl(templateUrl);
  if (!resolved) {
    throw new Error("Certificate template URL is invalid");
  }

  const res = await fetch(resolved);
  if (!res.ok) {
    throw new Error("Failed to load certificate template");
  }

  return new Uint8Array(await res.arrayBuffer());
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

function centerTextX(text: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, size: number, boxX: number, boxWidth: number) {
  const textWidth = font.widthOfTextAtSize(text, size);
  return boxX + Math.max(0, (boxWidth - textWidth) / 2);
}

export async function generateCourseCertificatePdf(input: {
  templateUrl: string;
  fullName: string;
  completedAt: string;
}) {
  const [templateBytes, pdfDoc] = await Promise.all([
    fetchTemplateBytes(input.templateUrl),
    PDFDocument.create(),
  ]);

  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(loadFontBytes());

  let image;
  try {
    image = await pdfDoc.embedPng(templateBytes);
  } catch {
    image = await pdfDoc.embedJpg(templateBytes);
  }

  const width = image.width;
  const height = image.height;
  const page = pdfDoc.addPage([width, height]);

  page.drawImage(image, { x: 0, y: 0, width, height });

  const name = input.fullName.trim();
  const dateLabel = formatDate(input.completedAt);
  const nameBoxX = width * LAYOUT.nameX;
  const nameBoxWidth = width * LAYOUT.nameWidth;
  const nameSize = fitFontSize(name, font, nameBoxWidth, height * 0.034, height * 0.018);
  const nameX = centerTextX(name, font, nameSize, nameBoxX, nameBoxWidth);
  const nameY = height * (1 - LAYOUT.nameY);

  page.drawText(name, {
    x: nameX,
    y: nameY,
    size: nameSize,
    font,
    color: LAYOUT.gold,
  });

  const dateSize = fitFontSize(dateLabel, font, width * 0.25, height * 0.02, height * 0.012);
  page.drawText(dateLabel, {
    x: width * LAYOUT.dateX,
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
