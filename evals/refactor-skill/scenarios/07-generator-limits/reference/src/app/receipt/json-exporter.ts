import { inject, Injectable } from '@angular/core';
import type { Receipt } from './exporter';
import { MONEY_FORMAT } from './money-format';
import type { ExportContext, ReceiptExporter } from './receipt-exporter';

@Injectable()
export class JsonExporter implements ReceiptExporter {
  private readonly money = inject(MONEY_FORMAT);

  isApplicableTo(context: ExportContext): boolean {
    return context.kind === 'json';
  }

  getPriority(): number {
    return 0;
  }

  export(receipt: Receipt): string {
    return JSON.stringify({ total: this.money(receipt.total) });
  }
}
