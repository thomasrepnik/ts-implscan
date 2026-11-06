import { Component, inject, signal } from '@angular/core';
import { StatementExporterDispatcher } from '../generated/implscan-registry';
import { ExportFormat } from './export-format';

@Component({
  selector: 'app-export-page',
  template: `
    <button data-testid="pdf" (click)="format.set('pdf')">PDF</button>
    <button data-testid="xml" (click)="format.set('xml')">XML</button>
    <button data-testid="run" (click)="run()">Export</button>
    <output data-testid="result">{{ result() }}</output>
  `,
})
export class ExportPageComponent {
  private readonly exporter = inject(StatementExporterDispatcher);
  readonly format = inject(ExportFormat).format;
  readonly result = signal('');

  run(): void {
    this.result.set(this.exporter.export(10));
  }
}
