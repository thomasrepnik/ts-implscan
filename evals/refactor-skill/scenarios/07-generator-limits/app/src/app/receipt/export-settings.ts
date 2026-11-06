import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExportSettings {
  readonly kind = signal<'csv' | 'json'>('csv');
}
