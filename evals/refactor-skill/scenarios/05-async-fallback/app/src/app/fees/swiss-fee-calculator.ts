import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SwissFeeCalculator {
  fee(amount: number): number {
    return (amount * 2) / 100;
  }
}
