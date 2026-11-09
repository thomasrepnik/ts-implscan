import type { ReceiptFormatter } from './receipt-formatter.ts';

export class PlainTextFormatter implements ReceiptFormatter {
  isApplicableTo() {
    return true;
  }
  format(lines: string[]) {
    return lines.join('\n');
  }
}
