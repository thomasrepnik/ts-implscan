import { Component, inject, signal } from '@angular/core';
import { CardFormatter } from './card-formatter';
import { PanelState } from './panel-state';
import { TwintFormatter } from './twint-formatter';

@Component({
  selector: 'app-payment-panel',
  providers: [PanelState, CardFormatter, TwintFormatter],
  template: `
    <button class="card" (click)="state.method.set('card')">Card</button>
    <button class="twint" (click)="state.method.set('twint')">Twint</button>
    <button class="submit" (click)="submit()">Submit</button>
    <output class="result">{{ result() }}</output>
  `,
})
export class PaymentPanelComponent {
  readonly state = inject(PanelState);
  private readonly card = inject(CardFormatter);
  private readonly twint = inject(TwintFormatter);
  readonly result = signal('');

  submit(): void {
    this.state.count.update((count) => count + 1);
    this.result.set(this.state.method() === 'card' ? this.card.format(10) : this.twint.format(10));
  }
}
