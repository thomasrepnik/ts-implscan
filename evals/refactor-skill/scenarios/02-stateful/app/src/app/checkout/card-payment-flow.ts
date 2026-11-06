import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CardPaymentFlow {
  private amount = 0;

  begin(amount: number): void {
    this.amount = amount;
  }

  addFee(fee: number): void {
    this.amount += fee;
  }

  summary(): string {
    return `card:${this.amount}`;
  }
}
