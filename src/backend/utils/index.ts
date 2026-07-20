export function formatDateIso(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseAmount(val: any): number {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
}
