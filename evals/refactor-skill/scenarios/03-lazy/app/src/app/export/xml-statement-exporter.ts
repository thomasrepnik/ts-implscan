import { Injectable } from '@angular/core';

const SCHEMA_TABLE = 'LAZY_XML_SCHEMA_TABLE:camt053,camt054,pain001,pain002';

@Injectable({ providedIn: 'root' })
export class XmlStatementExporter {
  export(total: number): string {
    return `xml:${total}:${SCHEMA_TABLE.length}`;
  }
}
