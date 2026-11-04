import type { ReceiptFormatter } from './receipt-formatter.ts';

export class MarkdownFormatter implements ReceiptFormatter {
  isApplicableTo() {
    return process.env.RECEIPT_FORMAT === 'md';
  }
  getPriority() {
    return 10; // beats PlainTextFormatter when both apply
  }
  format(lines: string[]) {
    return lines.map((line) => `- ${line}`).join('\n');
  }
}
