export function receiptBody(lines: string[], total: number): string {
  const body = lines.map((line, index) => `${index + 1}. ${line.trim()}`).join('\n');
  return `${body}\nTotal: ${total.toFixed(2)}`;
}
