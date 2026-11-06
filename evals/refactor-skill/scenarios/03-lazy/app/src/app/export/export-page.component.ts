import { Component, inject, signal } from '@angular/core';
import { PdfStatementExporter } from './pdf-statement-exporter';
import { XmlStatementExporter } from './xml-statement-exporter';

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
  private readonly pdf = inject(PdfStatementExporter);
  private readonly xml = inject(XmlStatementExporter);
  readonly format = signal<'pdf' | 'xml'>('pdf');
  readonly result = signal('');

  run(): void {
    this.result.set(this.format() === 'pdf' ? this.pdf.export(10) : this.xml.export(10));
  }
}
