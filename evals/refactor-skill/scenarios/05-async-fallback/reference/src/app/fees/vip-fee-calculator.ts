import { Injectable } from '@angular/core';
import type { FeeCalculator, FeeContext } from './fee-calculator';

@Injectable()
export class VipFeeCalculator implements FeeCalculator {
  isApplicableTo(context: FeeContext): boolean {
    return context.profile?.vip === true;
  }

  getPriority(): number {
    return 20;
  }

  fee(amount: number): number {
    return (amount * 1) / 100;
  }
}
