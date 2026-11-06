import { inject, Injectable } from '@angular/core';
import type { DispatchContextProvider } from '@thomasrepnik/ts-implscan';
import { ExportSettings } from './export-settings';
import type { ExportContext } from './receipt-exporter';

@Injectable()
export class ExportContextProvider implements DispatchContextProvider<ExportContext> {
  private readonly settings = inject(ExportSettings);

  get(): ExportContext {
    return { kind: this.settings.kind() };
  }
}
