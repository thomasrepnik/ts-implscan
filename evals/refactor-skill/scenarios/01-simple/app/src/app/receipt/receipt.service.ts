import { inject, Injectable } from '@angular/core';
import { CsvReceiptExporter } from './csv-receipt-exporter';
import { PdfReceiptExporter } from './pdf-receipt-exporter';
import { ReceiptSettings } from './receipt-settings';

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly settings = inject(ReceiptSettings);
  private readonly pdf = inject(PdfReceiptExporter);
  private readonly csv = inject(CsvReceiptExporter);

  fileName(): string {
    switch (this.settings.format()) {
      case 'pdf':
        return `receipt.${this.pdf.extension}`;
      case 'csv':
        return `receipt.${this.csv.extension}`;
    }
  }

  export(lines: string[]): string {
    switch (this.settings.format()) {
      case 'pdf':
        return this.pdf.export(lines);
      case 'csv':
        return this.csv.export(lines);
    }
  }
}
