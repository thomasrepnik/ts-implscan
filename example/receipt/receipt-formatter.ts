import type { Dispatchable } from '../../src/index.ts';

// Context-free: each formatter decides itself whether it applies.
export interface ReceiptFormatter extends Dispatchable {
  format(lines: string[]): string;
}
