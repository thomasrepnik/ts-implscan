import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EmailReceiptSender {
  private last = '';

  send(address: string, lines: string[], total: number): string {
    const body = lines.map((line, index) => `${index + 1}. ${line.trim()}`).join('\n');
    this.last = `[mail to ${address}]\n${body}\nTotal: ${total.toFixed(2)}`;
    return this.last;
  }

  resend(): string {
    return this.last;
  }
}
