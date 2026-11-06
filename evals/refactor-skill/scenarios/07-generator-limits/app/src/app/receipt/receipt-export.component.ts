import { Component, inject, signal } from '@angular/core';
import { CsvExporter } from './csv-exporter';
import { ExportSettings } from './export-settings';
import { JsonExporter } from './json-exporter';

@Component({
  selector: 'app-receipt-export',
  template: `
    <button data-testid="run" (click)="run()">Export</button>
    <output data-testid="result">{{ result() }}</output>
  `,
})
export class ReceiptExportComponent {
  private readonly settings = inject(ExportSettings);
  private readonly csv = inject(CsvExporter);
  private readonly json = inject(JsonExporter);
  readonly result = signal('');

  run(): void {
    this.result.set(this.settings.kind() === 'csv' ? this.csv.export({ total: 5 }) : this.json.export({ total: 5 }));
  }
}
