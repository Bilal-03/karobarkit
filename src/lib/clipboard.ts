export async function copyText(value: string) {
  if (!value) throw new Error('There is nothing to copy yet.');
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    throw new Error('Clipboard access is not available in this browser.');
  }
  await navigator.clipboard.writeText(value);
}
