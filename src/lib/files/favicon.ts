import { calculateFaviconPlan, type FaviconInput } from '@/domain/files/favicon';
import { readImageFileInfo } from '@/domain/files/image';
import { safeFilename } from '@/lib/security/safe-filename';

interface OutputFile {
  name: string;
  blob: Blob;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeU16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}
function writeU32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true);
}

export async function createStoredZip(files: readonly OutputFile[]) {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = new Uint8Array(
      typeof file.blob.arrayBuffer === 'function'
        ? await file.blob.arrayBuffer()
        : await new Response(file.blob).arrayBuffer(),
    );
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    writeU32(localView, 0, 0x04034b50);
    writeU16(localView, 4, 20);
    writeU16(localView, 8, 0);
    writeU32(localView, 14, crc32(data));
    writeU32(localView, 18, data.length);
    writeU32(localView, 22, data.length);
    writeU16(localView, 26, name.length);
    local.set(name, 30);
    locals.push(local, data);
    const directory = new Uint8Array(46 + name.length);
    const directoryView = new DataView(directory.buffer);
    writeU32(directoryView, 0, 0x02014b50);
    writeU16(directoryView, 4, 20);
    writeU16(directoryView, 6, 20);
    writeU16(directoryView, 8, 0);
    writeU32(directoryView, 16, crc32(data));
    writeU32(directoryView, 20, data.length);
    writeU32(directoryView, 24, data.length);
    writeU16(directoryView, 28, name.length);
    writeU32(directoryView, 42, offset);
    directory.set(name, 46);
    central.push(directory);
    offset += local.length + data.length;
  }
  const centralBytes = central.reduce((sum, item) => sum + item.length, 0);
  const totalBytes = offset + centralBytes + 22;
  const result = new Uint8Array(totalBytes);
  let cursor = 0;
  for (const chunk of locals) {
    result.set(chunk, cursor);
    cursor += chunk.length;
  }
  const centralOffset = cursor;
  for (const chunk of central) {
    result.set(chunk, cursor);
    cursor += chunk.length;
  }
  const end = new DataView(result.buffer, cursor, 22);
  writeU32(end, 0, 0x06054b50);
  writeU16(end, 8, central.length);
  writeU16(end, 10, central.length);
  writeU32(end, 12, centralBytes);
  writeU32(end, 16, centralOffset);
  return new Blob([result], { type: 'application/zip' });
}

export async function renderFaviconPng(input: FaviconInput, size: number, sourceFile?: File) {
  const plan = calculateFaviconPlan(input);
  if (!plan.sizes.includes(size)) throw new Error('Choose a supported favicon output size.');
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser could not create a favicon canvas.');
  context.fillStyle = plan.background;
  context.fillRect(0, 0, size, size);
  if (plan.initials && input.mode === 'initials') {
    context.fillStyle = plan.foreground;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `700 ${Math.round(size * 0.4)}px ui-sans-serif, sans-serif`;
    context.fillText(plan.initials, size / 2, size / 2);
  } else if (sourceFile) {
    const info = await readImageFileInfo(sourceFile);
    const bitmap = await createImageBitmap(sourceFile);
    try {
      const scale = Math.min(size / info.width, size / info.height);
      const width = info.width * scale;
      const height = info.height * scale;
      context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height);
    } finally {
      bitmap.close();
    }
  }
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The browser could not encode this favicon.'))),
      'image/png',
    ),
  );
}

export async function createFaviconBundle(input: FaviconInput, sourceFile?: File) {
  const plan = calculateFaviconPlan(input);
  const files: OutputFile[] = [];
  for (const size of plan.sizes)
    files.push({ name: `icon-${size}x${size}.png`, blob: await renderFaviconPng(input, size, sourceFile) });
  const zip = await createStoredZip(files);
  return {
    files,
    zip,
    filename: safeFilename('karobarkit-favicon-icons', 'karobarkit-favicon-icons', 'zip'),
  };
}
