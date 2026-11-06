import { Injectable } from '@angular/core';
import type { StatementContext, StatementExporter } from './statement-exporter';

const FONT_TABLE = 'LAZY_PDF_FONT_TABLE:helvetica,courier,times,symbol,zapf';

@Injectable()
export class PdfStatementExporter implements StatementExporter {
  isApplicableTo(context: StatementContext): boolean {
    return context.format === 'pdf';
  }

  getPriority(): number {
    return 0;
  }

  export(total: number): string {
    return `pdf:${total}:${FONT_TABLE.length}`;
  }
}
