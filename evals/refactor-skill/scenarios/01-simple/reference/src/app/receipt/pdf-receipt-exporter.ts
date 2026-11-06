import { Injectable } from '@angular/core';
import type { ReceiptContext, ReceiptExporter } from './receipt-exporter';

@Injectable()
export class PdfReceiptExporter implements ReceiptExporter {
  readonly extension = 'pdf';

  isApplicableTo(context: ReceiptContext): boolean {
    return context.format === 'pdf';
  }

  getPriority(): number {
    return 0;
  }

  export(lines: string[]): string {
    return `PDF[${lines.join('|')}]`;
  }
}
