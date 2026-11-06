import type { Dispatchable } from '@thomasrepnik/ts-implscan';
import type { Receipt } from './exporter';

export interface ExportContext {
  kind: 'csv' | 'json';
}

export interface ReceiptExporter extends Dispatchable<ExportContext> {
  export(value: Receipt): string;
}
