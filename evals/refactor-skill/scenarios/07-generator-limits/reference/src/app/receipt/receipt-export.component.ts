import { Component, inject, signal } from '@angular/core';
import { ReceiptExporterDispatcher } from '../generated/implscan-registry';

@Component({
  selector: 'app-receipt-export',
  template: `
    <button data-testid="run" (click)="run()">Export</button>
    <output data-testid="result">{{ result() }}</output>
  `,
})
export class ReceiptExportComponent {
  private readonly exporter = inject(ReceiptExporterDispatcher);
  readonly result = signal('');

  run(): void {
    this.result.set(this.exporter.export({ total: 5 }));
  }
}
