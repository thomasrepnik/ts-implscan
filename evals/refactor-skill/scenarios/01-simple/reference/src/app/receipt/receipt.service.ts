import { inject, Injectable } from '@angular/core';
import { ReceiptExporterDispatcher } from '../generated/implscan-registry';

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly exporter = inject(ReceiptExporterDispatcher);

  fileName(): string {
    return `receipt.${this.exporter.extension}`;
  }

  export(lines: string[]): string {
    return this.exporter.export(lines);
  }
}
