import { inject, Injectable } from '@angular/core';
import type { DispatchContextProvider } from '@thomasrepnik/ts-implscan';
import type { PayContext } from './payment-handler';
import { PaySettings } from './pay-settings';

@Injectable()
export class PayContextProvider implements DispatchContextProvider<PayContext> {
  private readonly settings = inject(PaySettings);

  get(): PayContext {
    return { method: this.settings.method() };
  }
}
