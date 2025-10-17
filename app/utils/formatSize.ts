export function formatSize(bytes: number): string {
  // Guard against invalid inputs
  if (typeof bytes !== 'number' || isNaN(bytes) || !isFinite(bytes)) return '';
  if (bytes <= 0) return '0 KB';

  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  const format = (value: number, unit: string) => `${value.toFixed(2)} ${unit}`;

  if (bytes < MB) {
    return format(bytes / KB, 'KB');
  } else if (bytes < GB) {
    return format(bytes / MB, 'MB');
  } else {
    return format(bytes / GB, 'GB');
  }
}

export default formatSize;

export const generateUUID= ()=>crypto.randomUUID();
