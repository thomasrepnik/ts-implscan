import { inject, Injectable } from '@angular/core';
import type { DispatchContextProvider } from '@thomasrepnik/ts-implscan';
import type { ReceiptContext } from './receipt-exporter';
import { ReceiptSettings } from './receipt-settings';

@Injectable()
export class ReceiptContextProvider implements DispatchContextProvider<ReceiptContext> {
  private readonly settings = inject(ReceiptSettings);

  get(): ReceiptContext {
    return { format: this.settings.format() };
  }
}
