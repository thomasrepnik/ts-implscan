import { Injectable } from '@angular/core';
import type { StatementContext, StatementExporter } from './statement-exporter';

const SCHEMA_TABLE = 'LAZY_XML_SCHEMA_TABLE:camt053,camt054,pain001,pain002';

@Injectable()
export class XmlStatementExporter implements StatementExporter {
  isApplicableTo(context: StatementContext): boolean {
    return context.format === 'xml';
  }

  export(total: number): string {
    return `xml:${total}:${SCHEMA_TABLE.length}`;
  }
}
