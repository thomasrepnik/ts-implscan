import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CsvReceiptExporter {
  readonly extension = 'csv';

  export(lines: string[]): string {
    return lines.join(',');
  }
}
