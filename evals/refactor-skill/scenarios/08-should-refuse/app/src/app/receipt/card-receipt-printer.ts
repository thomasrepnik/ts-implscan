import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CardReceiptPrinter {
  print(lines: string[], total: number): string {
    const body = lines.map((line, index) => `${index + 1}. ${line.trim()}`).join('\n');
    return `[printer]\n${body}\nTotal: ${total.toFixed(2)}`;
  }
}
