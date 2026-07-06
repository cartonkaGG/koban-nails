import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { LegalSection } from "@/content/legal";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 50;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

type FontBundle = {
  regular: PDFFont;
  bold: PDFFont;
};

type LayoutState = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  fonts: FontBundle;
};

let bodyRegularBytes: Uint8Array | null = null;
let bodyBoldBytes: Uint8Array | null = null;

function readFontFile(candidates: string[]) {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return new Uint8Array(fs.readFileSync(candidate));
    }
  }
  throw new Error(`Font file not found (${candidates[0]})`);
}

function loadBodyFonts() {
  const root = process.cwd();
  if (!bodyRegularBytes) {
    bodyRegularBytes = readFontFile([
      path.join(root, "src/assets/fonts/noto-serif-cyrillic-400-normal.woff2"),
      path.join(
        root,
        "node_modules/@fontsource/noto-serif/files/noto-serif-cyrillic-400-normal.woff2",
      ),
    ]);
  }
  if (!bodyBoldBytes) {
    bodyBoldBytes = readFontFile([
      path.join(root, "src/assets/fonts/noto-serif-cyrillic-700-normal.woff2"),
      path.join(
        root,
        "node_modules/@fontsource/noto-serif/files/noto-serif-cyrillic-700-normal.woff2",
      ),
      path.join(root, "src/assets/fonts/noto-serif-cyrillic-400-normal.woff2"),
      path.join(
        root,
        "node_modules/@fontsource/noto-serif/files/noto-serif-cyrillic-400-normal.woff2",
      ),
    ]);
  }
  return { regular: bodyRegularBytes, bold: bodyBoldBytes };
}

async function embedFonts(doc: PDFDocument): Promise<FontBundle> {
  const bytes = loadBodyFonts();
  doc.registerFontkit(fontkit);
  const [regular, bold] = await Promise.all([doc.embedFont(bytes.regular), doc.embedFont(bytes.bold)]);
  return { regular, bold };
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function ensureSpace(state: LayoutState, needed: number) {
  if (state.y - needed >= MARGIN) return;

  state.page = state.doc.addPage([PAGE.width, PAGE.height]);
  state.y = PAGE.height - MARGIN;
}

function drawLines(
  state: LayoutState,
  lines: string[],
  font: PDFFont,
  fontSize: number,
  color = rgb(0.12, 0.12, 0.12),
  indent = 0,
) {
  const lineHeight = fontSize * 1.45;

  for (const line of lines) {
    ensureSpace(state, lineHeight);
    state.page.drawText(line, {
      x: MARGIN + indent,
      y: state.y,
      size: fontSize,
      font,
      color,
      maxWidth: CONTENT_WIDTH - indent,
    });
    state.y -= lineHeight;
  }
}

function drawParagraph(state: LayoutState, text: string, fontSize = 10, indent = 0) {
  const lines = wrapText(text, state.fonts.regular, fontSize, CONTENT_WIDTH - indent);
  drawLines(state, lines, state.fonts.regular, fontSize, rgb(0.12, 0.12, 0.12), indent);
  state.y -= 4;
}

function drawSectionTitle(state: LayoutState, title: string) {
  state.y -= 8;
  const fontSize = 11;
  const lines = wrapText(title, state.fonts.bold, fontSize, CONTENT_WIDTH);
  drawLines(state, lines, state.fonts.bold, fontSize, rgb(0.05, 0.05, 0.05));
  state.y -= 2;
}

function renderSections(state: LayoutState, sections: LegalSection[]) {
  for (const section of sections) {
    drawSectionTitle(state, section.title);

    for (const block of section.blocks) {
      if (block.kind === "list") {
        for (const item of block.items) {
          const lines = wrapText(`• ${item}`, state.fonts.regular, 10, CONTENT_WIDTH - 14);
          drawLines(state, lines, state.fonts.regular, 10, rgb(0.12, 0.12, 0.12), 14);
        }
        state.y -= 2;
        continue;
      }

      drawParagraph(state, block.value);
    }
  }
}

export type LegalPdfInput = {
  title: string;
  subtitle?: string;
  sections: LegalSection[];
};

export async function generateLegalPdf({ title, subtitle, sections }: LegalPdfInput) {
  const doc = await PDFDocument.create();
  const fonts = await embedFonts(doc);
  const page = doc.addPage([PAGE.width, PAGE.height]);

  const state: LayoutState = {
    doc,
    page,
    y: PAGE.height - MARGIN,
    fonts,
  };

  const titleSize = 18;
  const titleLines = wrapText(title, fonts.bold, titleSize, CONTENT_WIDTH);
  drawLines(state, titleLines, fonts.bold, titleSize, rgb(0.05, 0.05, 0.05));
  state.y -= 6;

  if (subtitle) {
    const subtitleLines = wrapText(subtitle, fonts.regular, 9, CONTENT_WIDTH);
    drawLines(state, subtitleLines, fonts.regular, 9, rgb(0.35, 0.35, 0.35));
    state.y -= 10;
  } else {
    state.y -= 4;
  }

  renderSections(state, sections);

  return doc.save();
}
