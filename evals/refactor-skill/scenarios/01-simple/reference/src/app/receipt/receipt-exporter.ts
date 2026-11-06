import type { Dispatchable } from '@thomasrepnik/ts-implscan';

export interface ReceiptContext {
  format: 'pdf' | 'csv';
}

export interface ReceiptExporter extends Dispatchable<ReceiptContext> {
  readonly extension: string;
  export(lines: string[]): string;
}
