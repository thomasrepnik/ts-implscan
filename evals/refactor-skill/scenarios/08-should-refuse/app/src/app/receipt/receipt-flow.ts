import { inject, Injectable } from '@angular/core';
import { CardReceiptPrinter } from './card-receipt-printer';
import { EmailReceiptSender } from './email-receipt-sender';

@Injectable({ providedIn: 'root' })
export class ReceiptFlow {
  private readonly printer = inject(CardReceiptPrinter);
  private readonly sender = inject(EmailReceiptSender);

  complete(address: string, lines: string[], total: number): string[] {
    return [this.printer.print(lines, total), this.sender.send(address, lines, total)];
  }

  resendMail(): string {
    return this.sender.resend();
  }
}
