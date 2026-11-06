import type { Dispatchable } from '@thomasrepnik/ts-implscan';

export interface StatementContext {
  format: 'pdf' | 'xml';
}

export interface StatementExporter extends Dispatchable<StatementContext> {
  export(total: number): string;
}
