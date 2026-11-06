import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StandardFeeCalculator {
  fee(amount: number): number {
    return (amount * 3) / 100;
  }
}
