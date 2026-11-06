import { Injectable } from '@angular/core';

const FONT_TABLE = 'LAZY_PDF_FONT_TABLE:helvetica,courier,times,symbol,zapf';

@Injectable({ providedIn: 'root' })
export class PdfStatementExporter {
  export(total: number): string {
    return `pdf:${total}:${FONT_TABLE.length}`;
  }
}
