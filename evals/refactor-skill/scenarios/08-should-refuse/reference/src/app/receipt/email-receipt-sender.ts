import { Injectable } from '@angular/core';
import { receiptBody } from './receipt-body';

@Injectable({ providedIn: 'root' })
export class EmailReceiptSender {
  private last = '';

  send(address: string, lines: string[], total: number): string {
    this.last = `[mail to ${address}]\n${receiptBody(lines, total)}`;
    return this.last;
  }

  resend(): string {
    return this.last;
  }
}
