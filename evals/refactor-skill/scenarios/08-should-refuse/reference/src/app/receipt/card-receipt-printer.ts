import { Injectable } from '@angular/core';
import { receiptBody } from './receipt-body';

@Injectable({ providedIn: 'root' })
export class CardReceiptPrinter {
  print(lines: string[], total: number): string {
    return `[printer]\n${receiptBody(lines, total)}`;
  }
}
