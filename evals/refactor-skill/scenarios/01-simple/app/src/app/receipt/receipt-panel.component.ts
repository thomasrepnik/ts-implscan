import { Component, inject, signal } from '@angular/core';
import { ReceiptService } from './receipt.service';

@Component({
  selector: 'app-receipt-panel',
  template: `
    <button data-testid="export" (click)="run()">Export</button>
    <output data-testid="result">{{ result() }}</output>
  `,
})
export class ReceiptPanelComponent {
  private readonly receipts = inject(ReceiptService);
  readonly result = signal('');

  run(): void {
    this.result.set(`${this.receipts.fileName()}: ${this.receipts.export(['a', 'b'])}`);
  }
}
