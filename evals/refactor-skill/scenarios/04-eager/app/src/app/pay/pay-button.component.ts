import { Component, inject, signal } from '@angular/core';
import { PaymentRouter } from './payment-router';

@Component({
  selector: 'app-pay-button',
  template: `
    <button data-testid="pay" (click)="pay()">Pay</button>
    <output data-testid="result">{{ result() }}</output>
  `,
})
export class PayButtonComponent {
  private readonly router = inject(PaymentRouter);
  readonly result = signal('');

  pay(): void {
    this.router.pay(10).subscribe((text) => this.result.set(text));
  }
}
