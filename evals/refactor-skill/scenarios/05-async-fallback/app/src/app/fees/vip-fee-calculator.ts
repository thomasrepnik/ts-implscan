import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VipFeeCalculator {
  fee(amount: number): number {
    return (amount * 1) / 100;
  }
}
