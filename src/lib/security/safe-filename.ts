export function safeFilename(value: string, fallback = 'karobarkit-document', extension = 'bin') {
  const safeBase = value
    .normalize('NFKC')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .toLowerCase();
  const safeFallback = fallback
    .normalize('NFKC')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .toLowerCase();
  const normalizedExtension = extension.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
  return `${safeBase || safeFallback || 'download'}.${normalizedExtension}`;
}
