import { inject, Injectable } from '@angular/core';
import { CurrencyFormatterDispatcher } from '../generated/implscan-registry';
import type { Exporter, Receipt } from './exporter';

@Injectable({ providedIn: 'root' })
export class JsonExporter implements Exporter<Receipt> {
  private readonly money = inject(CurrencyFormatterDispatcher);

  export(receipt: Receipt): string {
    return JSON.stringify({ total: this.money.format(receipt.total) });
  }
}
