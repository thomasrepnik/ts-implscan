import { Component, inject, signal } from '@angular/core';
import { PaymentSession } from './payment-session';

@Component({
  selector: 'app-checkout',
  template: `
    <button data-testid="begin" (click)="begin()">Begin</button>
    <button data-testid="fee" (click)="fee()">Add fee</button>
    <button data-testid="show" (click)="show()">Show</button>
    <output data-testid="summary">{{ text() }}</output>
  `,
})
export class CheckoutComponent {
  private readonly session = inject(PaymentSession);
  readonly text = signal('');

  begin(): void {
    this.session.begin(100);
  }

  fee(): void {
    this.session.addFee(5);
  }

  show(): void {
    this.text.set(this.session.summary());
  }
}
