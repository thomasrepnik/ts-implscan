import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExportFormat {
  readonly format = signal<'pdf' | 'xml'>('pdf');
}
