import { Injectable } from '@angular/core';
import type { ReceiptContext, ReceiptExporter } from './receipt-exporter';

@Injectable()
export class CsvReceiptExporter implements ReceiptExporter {
  readonly extension = 'csv';

  isApplicableTo(context: ReceiptContext): boolean {
    return context.format === 'csv';
  }

  getPriority(): number {
    return 0;
  }

  export(lines: string[]): string {
    return lines.join(',');
  }
}
