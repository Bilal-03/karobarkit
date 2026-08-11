import fontkit from '@pdf-lib/fontkit';
import regeneratorRuntime from 'regenerator-runtime/runtime.js';
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';

import devanagariBoldUrl from '@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-700-normal.woff2';
import devanagariRegularUrl from '@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2';
import latinBoldUrl from '@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-latin-700-normal.woff2';
import latinRegularUrl from '@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-latin-400-normal.woff2';

import { DocumentExportError } from '@/domain/documents/errors';
import type { WorkplaceDocument, WorkplacePageProfile } from '@/domain/documents/workplace';
import { calculateBarcode } from '@/domain/qr/barcode';
import { renderQrPngDataUrl } from '@/lib/qr/render';

const MM = 72 / 25.4;
const A4 = { width: 210 * MM, height: 297 * MM };
const PROFILE_DIMENSIONS: Record<WorkplacePageProfile, { width: number; height: number }> = {
  a4: A4,
  'thermal-58': { width: 58 * MM, height: 200 * MM },
  'thermal-80': { width: 80 * MM, height: 200 * MM },
  'label-4x6': { width: 4 * 72, height: 6 * 72 },
  'label-sheet-a4': A4,
};

const COLORS = {
  ink: rgb(0.08, 0.12, 0.15),
  muted: rgb(0.35, 0.4, 0.42),
  line: rgb(0.75, 0.78, 0.76),
  accent: rgb(0.04, 0.38, 0.35),
  paper: rgb(0.99, 0.995, 0.99),
};

interface PdfFonts {
  latin: { regular: PDFFont; bold: PDFFont };
  devanagari: { regular: PDFFont; bold: PDFFont };
}

function isDevanagari(character: string) {
  const point = character.codePointAt(0) ?? 0;
  return (
    (point >= 0x0900 && point <= 0x097f) ||
    (point >= 0x1cd0 && point <= 0x1cf9) ||
    (point >= 0x200c && point <= 0x200d)
  );
}

function fontFor(character: string, fonts: PdfFonts, bold: boolean) {
  const family = isDevanagari(character) ? fonts.devanagari : fonts.latin;
  return bold ? family.bold : family.regular;
}

function textRuns(value: string, fonts: PdfFonts, bold: boolean) {
  const runs: Array<{ text: string; font: PDFFont }> = [];
  let current = '';
  let currentFamily: boolean | undefined;
  for (const character of value.replace(/[\u0000-\u001f\u007f]/gu, ' ')) {
    const devanagari = isDevanagari(character);
    if (current && devanagari !== currentFamily) {
      runs.push({ text: current, font: fontFor(current[0] ?? '', fonts, bold) });
      current = '';
    }
    current += character;
    currentFamily = devanagari;
  }
  if (current) runs.push({ text: current, font: fontFor(current[0] ?? '', fonts, bold) });
  return runs;
}

function measureText(value: string, fonts: PdfFonts, size: number, bold = false) {
  return textRuns(value, fonts, bold).reduce(
    (width, run) => width + run.font.widthOfTextAtSize(run.text, size),
    0,
  );
}

function drawText(
  page: PDFPage,
  value: string,
  x: number,
  y: number,
  fonts: PdfFonts,
  size: number,
  bold = false,
  color = COLORS.ink,
) {
  let cursor = x;
  for (const run of textRuns(value, fonts, bold)) {
    page.drawText(run.text, { x: cursor, y, size, font: run.font, color });
    cursor += run.font.widthOfTextAtSize(run.text, size);
  }
}

function wrapText(value: string, fonts: PdfFonts, size: number, maxWidth: number, bold = false) {
  const lines: string[] = [];
  for (const paragraph of value.split('\n')) {
    const words = paragraph.split(/\s+/u).filter(Boolean);
    if (!words.length) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measureText(candidate, fonts, size, bold) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      if (measureText(word, fonts, size, bold) <= maxWidth) {
        current = word;
        continue;
      }
      let chunk = '';
      for (const character of word) {
        if (chunk && measureText(`${chunk}${character}`, fonts, size, bold) > maxWidth) {
          lines.push(chunk);
          chunk = character;
        } else {
          chunk += character;
        }
      }
      current = chunk;
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : [''];
}

async function loadFont(pdf: PDFDocument, url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new DocumentExportError('pdf_failed', 'The PDF font could not be loaded.');
  return pdf.embedFont(new Uint8Array(await response.arrayBuffer()), { subset: false });
}

async function loadFonts(pdf: PDFDocument): Promise<PdfFonts> {
  (globalThis as typeof globalThis & { regeneratorRuntime?: typeof regeneratorRuntime }).regeneratorRuntime =
    regeneratorRuntime;
  pdf.registerFontkit(fontkit);
  const [latinRegular, latinBold, devanagariRegular, devanagariBold] = await Promise.all([
    loadFont(pdf, latinRegularUrl),
    loadFont(pdf, latinBoldUrl),
    loadFont(pdf, devanagariRegularUrl),
    loadFont(pdf, devanagariBoldUrl),
  ]);
  return {
    latin: { regular: latinRegular, bold: latinBold },
    devanagari: { regular: devanagariRegular, bold: devanagariBold },
  };
}

function dataUrlBytes(dataUrl: string) {
  const encoded = dataUrl.split(',')[1];
  if (!encoded) throw new DocumentExportError('pdf_failed', 'The QR image could not be prepared.');
  const binary = atob(encoded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function drawBarcode(
  page: PDFPage,
  value: string,
  x: number,
  yTop: number,
  width: number,
  height: number,
  fonts: PdfFonts,
) {
  try {
    const barcode = calculateBarcode({ symbology: 'code128', value, showLabel: true, width: 'compact' });
    const modules = Array.from(barcode.modulePattern, Number);
    const total = modules.reduce((sum, module) => sum + module, 0);
    const unit = width / total;
    let cursor = x;
    modules.forEach((module, index) => {
      const moduleWidth = module * unit;
      if (index % 2 === 0) {
        page.drawRectangle({ x: cursor, y: yTop - height, width: moduleWidth, height, color: COLORS.ink });
      }
      cursor += moduleWidth;
    });
    const labelSize = Math.min(8, Math.max(5.5, width / Math.max(20, value.length * 1.8)));
    const labelWidth = measureText(barcode.humanReadable, fonts, labelSize);
    drawText(
      page,
      barcode.humanReadable,
      x + Math.max(0, (width - labelWidth) / 2),
      yTop - height - 11,
      fonts,
      labelSize,
    );
    return true;
  } catch {
    return false;
  }
}

function preparePage(page: PDFPage, dimensions: { width: number; height: number }) {
  page.drawRectangle({ x: 0, y: 0, width: dimensions.width, height: dimensions.height, color: COLORS.paper });
  page.drawRectangle({
    x: 0,
    y: dimensions.height - 7,
    width: dimensions.width,
    height: 7,
    color: COLORS.accent,
  });
}

function drawLabelSheet(
  pdf: PDFDocument,
  document: WorkplaceDocument,
  dimensions: { width: number; height: number },
  fonts: PdfFonts,
) {
  const page = pdf.addPage([dimensions.width, dimensions.height]);
  preparePage(page, dimensions);
  const margin = 38;
  const gap = 12;
  const cellWidth = (dimensions.width - margin * 2 - gap) / 2;
  const cellHeight = (dimensions.height - margin * 2 - gap * 3) / 4;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      const x = margin + column * (cellWidth + gap);
      const y = dimensions.height - margin - (row + 1) * cellHeight - row * gap;
      page.drawRectangle({
        x,
        y,
        width: cellWidth,
        height: cellHeight,
        borderColor: COLORS.line,
        borderWidth: 0.7,
      });
      const padding = 10;
      let cursor = y + cellHeight - padding - 9;
      drawText(page, document.statusLabel, x + padding, cursor, fonts, 7, true, COLORS.accent);
      cursor -= 17;
      const product = document.metadata.Product ?? document.title;
      for (const line of wrapText(product, fonts, 11, cellWidth - padding * 2, true).slice(0, 2)) {
        drawText(page, line, x + padding, cursor, fonts, 11, true);
        cursor -= 14;
      }
      const offer = document.metadata['Offer price'];
      if (offer) {
        drawText(
          page,
          offer.replaceAll('₹', 'Rs. '),
          x + padding,
          cursor - 3,
          fonts,
          13,
          true,
          COLORS.accent,
        );
      }
      if (document.barcode) {
        drawBarcode(page, document.barcode, x + padding, y + 53, cellWidth - padding * 2, 30, fonts);
      }
    }
  }
}

async function drawFlowDocument(
  pdf: PDFDocument,
  document: WorkplaceDocument,
  dimensions: { width: number; height: number },
  fonts: PdfFonts,
  qrImage?: PDFImage,
) {
  const compact = dimensions.width < 250;
  const margin = compact ? 14 : 38;
  const contentWidth = dimensions.width - margin * 2;
  const footerReserve = compact ? 68 : 82;
  let page = pdf.addPage([dimensions.width, dimensions.height]);
  preparePage(page, dimensions);
  let y = dimensions.height - margin;

  const newPage = (continued = false) => {
    page = pdf.addPage([dimensions.width, dimensions.height]);
    preparePage(page, dimensions);
    y = dimensions.height - margin;
    if (continued) {
      drawText(
        page,
        `${document.title} — continued`,
        margin,
        y,
        fonts,
        compact ? 8 : 10,
        true,
        COLORS.accent,
      );
      y -= compact ? 17 : 22;
    }
  };
  const ensure = (height: number) => {
    if (y - height < footerReserve) newPage(true);
  };
  const lines = (
    value: string,
    options: { size?: number; bold?: boolean; color?: typeof COLORS.ink; gap?: number } = {},
  ) => {
    const size = options.size ?? (compact ? 7.5 : 9);
    const lineHeight = size * 1.35;
    const wrapped = wrapText(value, fonts, size, contentWidth, options.bold);
    for (const line of wrapped) {
      ensure(lineHeight);
      drawText(page, line, margin, y, fonts, size, options.bold, options.color);
      y -= lineHeight;
    }
    y -= options.gap ?? (compact ? 3 : 5);
  };
  const heading = (value: string) => {
    ensure(compact ? 18 : 23);
    lines(value, { size: compact ? 8.5 : 10, bold: true, color: COLORS.accent, gap: compact ? 4 : 7 });
  };

  lines(document.statusLabel, { size: compact ? 7 : 8.5, bold: true, color: COLORS.accent });
  lines(document.title, { size: compact ? 15 : 21, bold: true, gap: 2 });
  lines(document.subtitle, { size: compact ? 7.5 : 9.5, color: COLORS.muted, gap: compact ? 6 : 10 });
  lines(document.businessName, { size: compact ? 9 : 12, bold: true, gap: 2 });
  if (document.contactLine) lines(document.contactLine, { size: compact ? 7 : 8.5, color: COLORS.muted });
  page.drawLine({
    start: { x: margin, y },
    end: { x: margin + contentWidth, y },
    color: COLORS.line,
    thickness: 0.6,
  });
  y -= compact ? 10 : 15;

  for (const [label, value] of Object.entries(document.metadata)) {
    lines(`${label}: ${value}`, { size: compact ? 7.2 : 8.5, gap: 2 });
  }

  if (document.barcode) {
    heading('Scannable Code 128 barcode');
    ensure(compact ? 66 : 82);
    const barcodeHeight = compact ? 34 : 46;
    if (!drawBarcode(page, document.barcode, margin, y, contentWidth, barcodeHeight, fonts)) {
      lines(document.barcode);
    } else {
      y -= barcodeHeight + 18;
    }
  }

  if (qrImage) {
    heading('Scannable QR destination');
    const size = Math.min(compact ? 90 : 112, contentWidth);
    ensure(size + 12);
    page.drawImage(qrImage, { x: margin, y: y - size, width: size, height: size });
    y -= size + 5;
    lines(document.qrPayload ?? '', { size: compact ? 6.5 : 7.5, color: COLORS.muted });
  }

  for (const section of document.sections) {
    heading(section.heading);
    for (const line of section.lines) lines(`• ${line}`, { gap: 2 });
  }

  if (document.items.length) {
    heading('Items');
    for (const item of document.items) {
      const amount = `${item.quantity}${item.unit ? ` ${item.unit}` : ''} × ${item.unitPrice} = ${item.amount}`;
      lines(`${item.description} — ${amount}`, { gap: 2 });
      if (item.taxAmount && item.taxRate) {
        lines(`Declared tax ${item.taxAmount} @ ${item.taxRate}%`, {
          size: compact ? 6.8 : 7.8,
          color: COLORS.muted,
        });
      }
    }
  }

  if (document.totals) {
    heading('Totals');
    lines(`Subtotal / declared gross: ${document.totals.subtotal}`, { bold: true, gap: 2 });
    lines(`Tax / declared deductions: ${document.totals.tax}`, { bold: true, gap: 2 });
    lines(`Grand / net declared: ${document.totals.grandTotal}`, { bold: true, color: COLORS.accent });
    if (document.totals.amountInWords) lines(document.totals.amountInWords, { color: COLORS.muted });
  }

  const pages = pdf.getPages();
  pages.forEach((currentPage, index) => {
    const footerSize = compact ? 5.8 : 6.8;
    const footerWidth = dimensions.width - margin * 2;
    const footerLines = wrapText(document.disclaimer, fonts, footerSize, footerWidth).slice(
      0,
      compact ? 5 : 4,
    );
    let footerY = margin + footerLines.length * footerSize * 1.25 + 10;
    if (document.footerText) {
      for (const line of wrapText(document.footerText, fonts, footerSize, footerWidth).slice(0, 2)) {
        drawText(currentPage, line, margin, footerY, fonts, footerSize, false, COLORS.muted);
        footerY -= footerSize * 1.25;
      }
    }
    for (const line of footerLines) {
      drawText(currentPage, line, margin, footerY, fonts, footerSize, false, COLORS.muted);
      footerY -= footerSize * 1.25;
    }
    drawText(
      currentPage,
      `Created locally with KarobarKit · Page ${index + 1} of ${pages.length}`,
      margin,
      margin,
      fonts,
      footerSize,
      false,
      COLORS.muted,
    );
  });
}

export async function createWorkplaceDocumentPdf(document: WorkplaceDocument): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new DocumentExportError('pdf_failed', 'PDF downloads are available in your browser.');
  }
  try {
    const pdf = await PDFDocument.create();
    const fonts = await loadFonts(pdf);
    const dimensions = PROFILE_DIMENSIONS[document.pageProfile];
    if (document.type === 'price-tag' && document.pageProfile === 'label-sheet-a4') {
      drawLabelSheet(pdf, document, dimensions, fonts);
    } else {
      let qrImage: PDFImage | undefined;
      if (document.qrPayload) {
        qrImage = await pdf.embedPng(
          dataUrlBytes(await renderQrPngDataUrl(document.qrPayload, { size: 256 })),
        );
      }
      await drawFlowDocument(pdf, document, dimensions, fonts, qrImage);
    }
    const bytes = await pdf.save();
    return new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], { type: 'application/pdf' });
  } catch (error) {
    if (error instanceof DocumentExportError) throw error;
    throw new DocumentExportError(
      'pdf_failed',
      'We could not prepare the PDF. Try Print → Save as PDF instead.',
    );
  }
}
