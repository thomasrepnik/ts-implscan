import { inject, Injectable } from '@angular/core';
import type { DispatchContextProvider } from '@thomasrepnik/ts-implscan';
import { PanelState } from './panel-state';
import type { PanelContext } from './payment-formatter';

@Injectable()
export class PanelContextProvider implements DispatchContextProvider<PanelContext> {
  private readonly state = inject(PanelState);

  get(): PanelContext {
    return { method: this.state.method() };
  }
}
