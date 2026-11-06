import { inject, Injectable } from '@angular/core';
import type { DispatchContextProvider } from '@thomasrepnik/ts-implscan';
import { ActiveFlow } from './active-flow';
import type { ActiveFlowContext } from './payment-flow';

@Injectable()
export class ActiveFlowContextProvider implements DispatchContextProvider<ActiveFlowContext> {
  private readonly active = inject(ActiveFlow);

  get(): ActiveFlowContext {
    return { method: this.active.method() };
  }
}
