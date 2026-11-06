import { inject, Injectable } from '@angular/core';
import { FeeCalculatorDispatcher } from '../generated/implscan-registry';

@Injectable({ providedIn: 'root' })
export class FeeService {
  private readonly calculator = inject(FeeCalculatorDispatcher);

  fee(amount: number): number {
    return this.calculator.fee(amount);
  }
}
