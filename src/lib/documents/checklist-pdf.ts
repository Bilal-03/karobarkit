import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import type { TodoTask } from '@/domain/utilities/todo';

import { downloadDocumentBlob } from './export';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

export async function downloadChecklistPdf(tasks: readonly TodoTask[]) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - 56;

  const addPageIfNeeded = () => {
    if (y >= 54) return;
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - 48;
  };

  page.drawText('KarobarKit checklist', {
    x: 42,
    y,
    size: 20,
    font: bold,
    color: rgb(0.06, 0.16, 0.2),
  });
  y -= 32;
  page.drawText(`${tasks.length} task${tasks.length === 1 ? '' : 's'}`, {
    x: 42,
    y,
    size: 10,
    font: regular,
    color: rgb(0.35, 0.42, 0.45),
  });
  y -= 26;

  for (const task of tasks) {
    addPageIfNeeded();
    const prefix = task.completed ? '✓' : '□';
    page.drawText(prefix, { x: 44, y, size: 12, font: regular, color: rgb(0.05, 0.5, 0.45) });
    page.drawText(task.text, {
      x: 66,
      y,
      size: 11,
      font: regular,
      color: rgb(0.06, 0.16, 0.2),
      maxWidth: PAGE_WIDTH - 160,
    });
    page.drawText(task.priority, {
      x: PAGE_WIDTH - 92,
      y,
      size: 8,
      font: bold,
      color: rgb(0.35, 0.42, 0.45),
    });
    y -= 24;
  }

  const bytes = await pdf.save();
  downloadDocumentBlob(
    new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], { type: 'application/pdf' }),
    'karobarkit-checklist.pdf',
  );
}
