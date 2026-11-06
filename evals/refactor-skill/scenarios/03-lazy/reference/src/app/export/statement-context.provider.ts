import { inject, Injectable } from '@angular/core';
import type { DispatchContextProvider } from '@thomasrepnik/ts-implscan';
import { ExportFormat } from './export-format';
import type { StatementContext } from './statement-exporter';

@Injectable()
export class StatementContextProvider implements DispatchContextProvider<StatementContext> {
  private readonly selected = inject(ExportFormat);

  get(): StatementContext {
    return { format: this.selected.format() };
  }
}
