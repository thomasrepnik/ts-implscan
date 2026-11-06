import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReceiptSettings {
  readonly format = signal<'pdf' | 'csv'>('pdf');
}
