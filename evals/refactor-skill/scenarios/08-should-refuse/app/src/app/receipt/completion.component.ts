import { Component, inject, signal } from '@angular/core';
import { ReceiptFlow } from './receipt-flow';

@Component({
  selector: 'app-completion',
  template: `
    <button data-testid="complete" (click)="complete()">Complete</button>
    <button data-testid="resend" (click)="resend()">Resend</button>
    <pre data-testid="result">{{ result() }}</pre>
  `,
})
export class CompletionComponent {
  private readonly flow = inject(ReceiptFlow);
  readonly result = signal('');

  complete(): void {
    this.result.set(this.flow.complete('a@example.invalid', [' coffee '], 4.5).join('\n---\n'));
  }

  resend(): void {
    this.result.set(this.flow.resendMail());
  }
}
