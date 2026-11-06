import { Injectable } from '@angular/core';
import type { FeeCalculator, FeeContext } from './fee-calculator';

@Injectable()
export class SwissFeeCalculator implements FeeCalculator {
  isApplicableTo(context: FeeContext): boolean {
    return context.profile?.country === 'CH';
  }

  getPriority(): number {
    return 10;
  }

  fee(amount: number): number {
    return (amount * 2) / 100;
  }
}
