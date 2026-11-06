import { Component, inject, signal } from '@angular/core';
import { PaymentFormatterDispatcher, provideImplscan } from '../generated/implscan-registry';
import { PanelState } from './panel-state';

@Component({
  selector: 'app-payment-panel',
  providers: [PanelState, provideImplscan()],
  template: `
    <button class="card" (click)="state.method.set('card')">Card</button>
    <button class="twint" (click)="state.method.set('twint')">Twint</button>
    <button class="submit" (click)="submit()">Submit</button>
    <output class="result">{{ result() }}</output>
  `,
})
export class PaymentPanelComponent {
  readonly state = inject(PanelState);
  private readonly formatter = inject(PaymentFormatterDispatcher);
  readonly result = signal('');

  submit(): void {
    this.state.count.update((count) => count + 1);
    this.result.set(this.formatter.format(10));
  }
}
