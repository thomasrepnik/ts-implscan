import type { ImplScan } from '../../src/index.ts';

export interface Notifier extends ImplScan {
  notify(message: string): string;
}
