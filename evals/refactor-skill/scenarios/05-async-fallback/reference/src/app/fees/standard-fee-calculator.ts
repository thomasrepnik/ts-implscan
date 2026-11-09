import { Injectable } from '@angular/core';
import type { FeeCalculator, FeeContext } from './fee-calculator';

@Injectable()
export class StandardFeeCalculator implements FeeCalculator {
  isApplicableTo(context: FeeContext): boolean {
    return true;
  }

  fee(amount: number): number {
    return (amount * 3) / 100;
  }
}
