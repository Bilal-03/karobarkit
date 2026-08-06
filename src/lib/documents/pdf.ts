import { PDFDocument, PDFPage, rgb, type PDFFont, type PDFImage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import regeneratorRuntime from 'regenerator-runtime/runtime.js';

import devanagariBoldUrl from '@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-700-normal.woff2';
import devanagariRegularUrl from '@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2';
import latinBoldUrl from '@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-latin-700-normal.woff2';
import latinRegularUrl from '@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-latin-400-normal.woff2';

import { DocumentExportError } from '@/domain/documents/errors';
import type { BusinessDocument, LetterheadDocument, PaymentReceiptDocument } from '@/domain/documents/types';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MM = 72 / 25.4;
const INK = rgb(0.086, 0.129, 0.169);
const MUTED = rgb(0.32, 0.39, 0.43);
const LINE = rgb(0.72, 0.78, 0.75);
const PAPER = rgb(0.985, 0.99, 0.985);

interface PdfFonts {
  latin: { regular: PDFFont; bold: PDFFont };
  devanagari: { regular: PDFFont; bold: PDFFont };
}

interface PdfImageSource {
  image: PDFImage;
  width: number;
  height: number;
}

interface PaintOptions {
  size: number;
  bold?: boolean;
  color?: ReturnType<typeof rgb>;
  lineHeight?: number;
}

function accentColor(value: LetterheadDocument['branding']['accent']) {
  if (value === 'navy') return rgb(0.153, 0.267, 0.353);
  if (value === 'ochre') return rgb(0.545, 0.357, 0.051);
  return rgb(0.051, 0.404, 0.373);
}

function dataUrlBytes(dataUrl: string) {
  const match = /^data:[^;,]+;base64,([\s\S]+)$/u.exec(dataUrl);
  if (!match)
    throw new DocumentExportError('image_failed', 'The logo image is not available for PDF export.');
  const binary = atob(match[1]);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function loadFont(pdf: PDFDocument, url: string) {
  const response = await fetch(url);
  if (!response.ok)
    throw new DocumentExportError('pdf_failed', 'The PDF font could not be loaded. Use Print instead.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  // Full font embedding avoids a fontkit subset-queue failure for complex-script glyphs.
  return pdf.embedFont(bytes, { subset: false });
}

async function loadFonts(pdf: PDFDocument): Promise<PdfFonts> {
  if (typeof globalThis !== 'undefined') {
    (
      globalThis as typeof globalThis & { regeneratorRuntime?: typeof regeneratorRuntime }
    ).regeneratorRuntime = regeneratorRuntime;
  }
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

function isDevanagariCharacter(character: string) {
  const codePoint = character.codePointAt(0) ?? 0;
  return (
    (codePoint >= 0x0900 && codePoint <= 0x097f) ||
    (codePoint >= 0x1cd0 && codePoint <= 0x1cf9) ||
    (codePoint >= 0x200c && codePoint <= 0x200d) ||
    (codePoint >= 0x20a8 && codePoint <= 0x20f0)
  );
}

function fontForText(text: string, fonts: PdfFonts, bold: boolean) {
  return isDevanagariCharacter(text[0] ?? '')
    ? bold
      ? fonts.devanagari.bold
      : fonts.devanagari.regular
    : bold
      ? fonts.latin.bold
      : fonts.latin.regular;
}

function textRuns(text: string, fonts: PdfFonts, bold: boolean) {
  const runs: Array<{ text: string; font: PDFFont }> = [];
  let current = '';
  let currentIsDevanagari: boolean | null = null;
  for (const character of text) {
    const nextIsDevanagari = isDevanagariCharacter(character);
    if (current && nextIsDevanagari !== currentIsDevanagari) {
      runs.push({ text: current, font: fontForText(current, fonts, bold) });
      current = '';
    }
    current += character;
    currentIsDevanagari = nextIsDevanagari;
  }
  if (current) runs.push({ text: current, font: fontForText(current, fonts, bold) });
  return runs;
}

function measureText(text: string, fonts: PdfFonts, options: PaintOptions) {
  return textRuns(text, fonts, Boolean(options.bold)).reduce(
    (width, run) => width + run.font.widthOfTextAtSize(run.text, options.size),
    0,
  );
}

function drawText(page: PDFPage, text: string, x: number, y: number, fonts: PdfFonts, options: PaintOptions) {
  let cursor = x;
  for (const run of textRuns(text, fonts, Boolean(options.bold))) {
    page.drawText(run.text, {
      x: cursor,
      y,
      size: options.size,
      font: run.font,
      color: options.color ?? INK,
    });
    cursor += run.font.widthOfTextAtSize(run.text, options.size);
  }
}

function wrapLine(text: string, maxWidth: number, fonts: PdfFonts, options: PaintOptions) {
  const words = text.split(/(\s+)/u);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!word) continue;
    const candidate = current + word;
    if (!current || measureText(candidate, fonts, options) <= maxWidth) {
      current = candidate;
      continue;
    }
    lines.push(current.trim());
    current = word.trimStart();
  }
  if (current.trim()) lines.push(current.trim());
  return lines.length ? lines : [''];
}

function drawWrapped(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fonts: PdfFonts,
  options: PaintOptions,
) {
  const lineHeight = options.lineHeight ?? options.size * 1.4;
  let cursorY = y;
  for (const paragraph of text.split('\n')) {
    const lines = wrapLine(paragraph, maxWidth, fonts, options);
    for (const line of lines) {
      drawText(page, line, x, cursorY, fonts, options);
      cursorY -= lineHeight;
    }
    cursorY -= lineHeight * 0.35;
  }
  return cursorY;
}

function drawRule(page: PDFPage, x1: number, y: number, x2: number, color = LINE, thickness = 0.7) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, color, thickness });
}

function drawLogo(
  page: PDFPage,
  logo: PdfImageSource | undefined,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
) {
  if (!logo) return;
  const scale = Math.min(maxWidth / logo.width, maxHeight / logo.height);
  const width = logo.width * scale;
  const height = logo.height * scale;
  page.drawImage(logo.image, { x, y: y - height, width, height });
}

async function embedLogo(pdf: PDFDocument, document: BusinessDocument): Promise<PdfImageSource | undefined> {
  if (!document.logo) return undefined;
  try {
    const bytes = dataUrlBytes(document.logo.dataUrl);
    const image =
      document.logo.mimeType === 'image/jpeg' ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
    return { image, width: document.logo.width, height: document.logo.height };
  } catch {
    throw new DocumentExportError(
      'image_failed',
      'The logo could not be embedded in the PDF. Use Print instead.',
    );
  }
}

function drawTemplateFrame(page: PDFPage, document: BusinessDocument) {
  const accent = accentColor(document.branding.accent);
  page.drawRectangle({ x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT, color: PAPER });
  if (document.branding.template === 'editorial') {
    page.drawRectangle({ x: 0, y: A4_HEIGHT - 9, width: A4_WIDTH, height: 9, color: accent });
    page.drawRectangle({ x: 0, y: 0, width: 7, height: A4_HEIGHT, color: accent });
  } else {
    page.drawRectangle({
      x: 18,
      y: 18,
      width: A4_WIDTH - 36,
      height: A4_HEIGHT - 36,
      borderColor: accent,
      borderWidth: 1,
    });
  }
}

function drawIdentityHeader(
  page: PDFPage,
  document: BusinessDocument,
  fonts: PdfFonts,
  logo: PdfImageSource | undefined,
) {
  const margin = document.layout.marginLeftMm * MM;
  const contentWidth = A4_WIDTH - (document.layout.marginLeftMm + document.layout.marginRightMm) * MM;
  let y = A4_HEIGHT - document.layout.marginTopMm * MM;
  const accent = accentColor(document.branding.accent);
  const logoWidth = logo ? Math.min(88, contentWidth * 0.22) : 0;
  let nameX = margin;
  if (logo && document.branding.logoAlignment === 'right') {
    drawLogo(page, logo, margin + contentWidth - logoWidth, y, logoWidth, 54);
  } else if (logo && document.branding.logoAlignment === 'center') {
    drawLogo(page, logo, margin + (contentWidth - logoWidth) / 2, y, logoWidth, 54);
    y -= 64;
  } else if (logo) {
    drawLogo(page, logo, margin, y, logoWidth, 54);
    nameX += logoWidth + 14;
  }

  drawText(page, document.identity.name, nameX, y, fonts, { size: 22, bold: true, color: accent });
  if (document.identity.tagline) {
    drawWrapped(page, document.identity.tagline, nameX, y - 27, contentWidth - (nameX - margin), fonts, {
      size: 9,
      color: MUTED,
    });
  }

  const contactLines = [
    document.identity.address.text,
    [
      document.identity.contact.phone,
      document.identity.contact.email,
      document.identity.contact.website,
      document.identity.contact.additionalLine,
      document.identity.contact.socialHandle,
    ]
      .filter(Boolean)
      .join('  ·  '),
    [
      document.identity.gstin ? `GSTIN: ${document.identity.gstin}` : '',
      document.identity.cin ? `CIN: ${document.identity.cin}` : '',
      document.identity.registrationNumber ? `Reg. no.: ${document.identity.registrationNumber}` : '',
    ]
      .filter(Boolean)
      .join('  ·  '),
  ].filter(Boolean);
  const contactY = document.branding.logoAlignment === 'center' ? y - 66 : y - 57;
  let contactCursor = contactY;
  for (const line of contactLines) {
    contactCursor = drawWrapped(page, line, margin, contactCursor, contentWidth, fonts, {
      size: 8.5,
      color: MUTED,
    });
  }
  if (document.branding.headerDivider) {
    drawRule(page, margin, contactCursor - 4, margin + contentWidth, accent, 1.2);
  }
  return contactCursor - (document.branding.headerDivider ? 26 : 18);
}

function drawFooter(page: PDFPage, document: BusinessDocument, fonts: PdfFonts) {
  const margin = document.layout.marginLeftMm * MM;
  const contentWidth = A4_WIDTH - (document.layout.marginLeftMm + document.layout.marginRightMm) * MM;
  const footerY = document.layout.marginBottomMm * MM;
  if (document.branding.footerDivider) drawRule(page, margin, footerY + 22, margin + contentWidth, LINE);
  if (document.footerText) {
    drawWrapped(page, document.footerText, margin, footerY + 8, contentWidth, fonts, {
      size: 8,
      color: MUTED,
    });
  }
  drawText(page, 'Created locally with KarobarKit', margin + contentWidth - 160, footerY + 8, fonts, {
    size: 7.5,
    color: MUTED,
  });
}

function drawLetterheadPage(
  page: PDFPage,
  document: LetterheadDocument,
  fonts: PdfFonts,
  logo: PdfImageSource | undefined,
  body: string,
  pageIndex: number,
) {
  drawTemplateFrame(page, document);
  let y = drawIdentityHeader(page, document, fonts, logo);
  const margin = document.layout.marginLeftMm * MM;
  const contentWidth = A4_WIDTH - (document.layout.marginLeftMm + document.layout.marginRightMm) * MM;
  if (pageIndex === 0) {
    if (document.metadata.date) {
      drawText(page, document.displayDate, margin + contentWidth - 145, y, fonts, { size: 9, color: MUTED });
    }
    if (document.recipient.name) {
      y =
        drawWrapped(page, `To: ${document.recipient.name}`, margin, y, contentWidth, fonts, {
          size: 10,
          bold: true,
          color: INK,
        }) - 2;
    }
    if (document.recipient.address.text) {
      y = drawWrapped(page, document.recipient.address.text, margin, y, contentWidth * 0.65, fonts, {
        size: 9,
        color: MUTED,
      });
    }
    if (document.metadata.subject) {
      y -= 8;
      y = drawWrapped(page, `Subject: ${document.metadata.subject}`, margin, y, contentWidth, fonts, {
        size: 10,
        bold: true,
      });
    }
    y -= 12;
  } else {
    drawText(page, 'Letter continued', margin, y, fonts, { size: 9, bold: true, color: MUTED });
    y -= 28;
  }
  y = drawWrapped(page, body, margin, y, contentWidth, fonts, { size: 10.5, color: INK, lineHeight: 15 });
  if (
    pageIndex === document.bodyPages.length - 1 &&
    (document.signature.name || document.signature.showPlaceholder)
  ) {
    y = Math.max(y - 24, document.layout.marginBottomMm * MM + 92);
    if (document.signature.showPlaceholder) drawRule(page, margin, y, margin + 145, INK);
    if (document.signature.name)
      drawText(page, document.signature.name, margin, y - 18, fonts, { size: 9, bold: true });
    if (document.signature.designation)
      drawText(page, document.signature.designation, margin, y - 32, fonts, { size: 8.5, color: MUTED });
  }
  drawFooter(page, document, fonts);
}

function drawReceiptPage(
  page: PDFPage,
  document: PaymentReceiptDocument,
  fonts: PdfFonts,
  logo: PdfImageSource | undefined,
) {
  drawTemplateFrame(page, document);
  let y = drawIdentityHeader(page, document, fonts, logo);
  const margin = document.layout.marginLeftMm * MM;
  const contentWidth = A4_WIDTH - (document.layout.marginLeftMm + document.layout.marginRightMm) * MM;
  const accent = accentColor(document.branding.accent);

  drawText(page, 'PAYMENT RECEIPT', margin, y, fonts, { size: 18, bold: true, color: accent });
  drawText(page, document.displayDate, margin + contentWidth - 145, y, fonts, { size: 9, color: MUTED });
  y -= 30;
  drawRule(page, margin, y, margin + contentWidth, accent, 1.1);
  y -= 24;

  const half = contentWidth / 2 - 12;
  drawText(page, 'Receipt number', margin, y, fonts, { size: 8.5, bold: true, color: MUTED });
  drawWrapped(page, document.metadata.number, margin, y - 15, half, fonts, { size: 11, bold: true });
  drawText(page, 'Received from', margin + half + 24, y, fonts, { size: 8.5, bold: true, color: MUTED });
  drawWrapped(page, document.recipient.name, margin + half + 24, y - 15, half, fonts, {
    size: 11,
    bold: true,
  });
  y -= 60;
  if (document.recipient.address.text) {
    drawText(page, 'Customer address', margin, y, fonts, { size: 8.5, bold: true, color: MUTED });
    y = drawWrapped(page, document.recipient.address.text, margin, y - 15, contentWidth, fonts, {
      size: 9,
      color: INK,
    });
    y -= 7;
  }

  page.drawRectangle({
    x: margin,
    y: y - 88,
    width: contentWidth,
    height: 88,
    color: rgb(0.94, 0.97, 0.95),
    borderColor: LINE,
    borderWidth: 0.6,
  });
  drawText(page, 'Amount received', margin + 16, y - 24, fonts, { size: 9, bold: true, color: MUTED });
  drawText(page, document.monetaryValue.formatted, margin + 16, y - 54, fonts, {
    size: 23,
    bold: true,
    color: accent,
  });
  drawText(
    page,
    'Declared amount; verify settlement independently.',
    margin + contentWidth - 225,
    y - 54,
    fonts,
    { size: 7.5, color: MUTED },
  );
  y -= 120;

  drawText(page, 'Amount in words', margin, y, fonts, { size: 8.5, bold: true, color: MUTED });
  y = drawWrapped(page, document.monetaryValue.inWords, margin, y - 16, contentWidth, fonts, {
    size: 10,
    bold: true,
  });
  y -= 8;
  drawText(page, 'Payment purpose', margin, y, fonts, { size: 8.5, bold: true, color: MUTED });
  y = drawWrapped(page, document.paymentPurpose, margin, y - 16, contentWidth, fonts, { size: 10 });

  const detailLines = [
    document.paymentMethod ? `Payment method: ${document.paymentMethod}` : '',
    document.transactionReference ? `Transaction reference: ${document.transactionReference}` : '',
    document.invoiceReference ? `Invoice reference: ${document.invoiceReference}` : '',
    document.paymentNote ? `Note: ${document.paymentNote}` : '',
  ].filter(Boolean);
  if (detailLines.length) {
    y -= 10;
    y = drawWrapped(page, detailLines.join('\n'), margin, y, contentWidth, fonts, { size: 9, color: MUTED });
  }

  if (document.signature.name || document.signature.showPlaceholder) {
    y = Math.max(y - 24, document.layout.marginBottomMm * MM + 92);
    if (document.signature.showPlaceholder)
      drawRule(page, margin + contentWidth - 155, y, margin + contentWidth, INK);
    if (document.signature.name)
      drawText(page, document.signature.name, margin + contentWidth - 155, y - 18, fonts, {
        size: 9,
        bold: true,
      });
    if (document.signature.designation)
      drawText(page, document.signature.designation, margin + contentWidth - 155, y - 32, fonts, {
        size: 8.5,
        color: MUTED,
      });
  }
  y = Math.min(y, document.layout.marginBottomMm * MM + 78);
  drawWrapped(
    page,
    'This receipt records a payment declared by the issuer. It is not bank confirmation, proof of settlement, a government receipt or a GST tax invoice.',
    margin,
    y,
    contentWidth,
    fonts,
    { size: 8, color: MUTED },
  );
  drawFooter(page, document, fonts);
}

export async function createDocumentPdf(document: BusinessDocument): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new DocumentExportError('pdf_failed', 'PDF downloads are available in your browser.');
  }

  try {
    const pdf = await PDFDocument.create();
    const fonts = await loadFonts(pdf);
    const logo = await embedLogo(pdf, document);
    if (document.type === 'letterhead') {
      document.bodyPages.forEach((body, index) => {
        const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
        drawLetterheadPage(page, document, fonts, logo, body, index);
      });
    } else {
      const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
      drawReceiptPage(page, document, fonts, logo);
    }
    const bytes = await pdf.save();
    return new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], { type: 'application/pdf' });
  } catch (error) {
    if (error instanceof DocumentExportError) throw error;
    const message =
      error instanceof Error && /cannot encode|glyph|font/iu.test(error.message)
        ? 'Some characters are outside the PDF font range. Use Print → Save as PDF for full system-font support.'
        : 'We could not prepare the PDF. Try Print → Save as PDF instead.';
    throw new DocumentExportError('pdf_failed', message);
  }
}
