import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PdfReceiptExporter {
  readonly extension = 'pdf';

  export(lines: string[]): string {
    return `PDF[${lines.join('|')}]`;
  }
}
