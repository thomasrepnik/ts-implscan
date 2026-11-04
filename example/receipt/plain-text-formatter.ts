import type { ReceiptFormatter } from './receipt-formatter.ts';

export class PlainTextFormatter implements ReceiptFormatter {
  isApplicableTo() {
    return true;
  }
  getPriority() {
    return 0;
  }
  format(lines: string[]) {
    return lines.join('\n');
  }
}
