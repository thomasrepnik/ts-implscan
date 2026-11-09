import { inject, Injectable } from '@angular/core';
import type { Receipt } from './exporter';
import { MONEY_FORMAT } from './money-format';
import type { ExportContext, ReceiptExporter } from './receipt-exporter';

@Injectable()
export class CsvExporter implements ReceiptExporter {
  private readonly money = inject(MONEY_FORMAT);

  isApplicableTo(context: ExportContext): boolean {
    return context.kind === 'csv';
  }

  export(receipt: Receipt): string {
    return `total,${this.money(receipt.total)}`;
  }
}
