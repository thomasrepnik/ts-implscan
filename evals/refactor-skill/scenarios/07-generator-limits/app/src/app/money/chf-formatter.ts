import type { CurrencyContext, CurrencyFormatter } from './currency-formatter';

export class ChfFormatter implements CurrencyFormatter {
  isApplicableTo(context: CurrencyContext): boolean {
    return context.currency === 'CHF';
  }

  getPriority(): number {
    return 0;
  }

  format(amount: number): string {
    return `CHF ${amount}`;
  }
}
