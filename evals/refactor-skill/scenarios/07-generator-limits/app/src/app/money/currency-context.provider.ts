import { inject, Injectable } from '@angular/core';
import type { DispatchContextProvider } from '@thomasrepnik/ts-implscan';
import type { CurrencyContext } from './currency-formatter';
import { CurrencySettings } from './currency-settings';

@Injectable()
export class CurrencyContextProvider implements DispatchContextProvider<CurrencyContext> {
  private readonly settings = inject(CurrencySettings);

  get(): CurrencyContext {
    return { currency: this.settings.currency() };
  }
}
