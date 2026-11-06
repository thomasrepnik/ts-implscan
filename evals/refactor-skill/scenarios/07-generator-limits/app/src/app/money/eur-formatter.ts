import type { CurrencyContext, CurrencyFormatter } from './currency-formatter';

export class EurFormatter implements CurrencyFormatter {
  isApplicableTo(context: CurrencyContext): boolean {
    return context.currency === 'EUR';
  }

  getPriority(): number {
    return 0;
  }

  format(amount: number): string {
    return `EUR ${amount}`;
  }
}
