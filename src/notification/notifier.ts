import type { ImplScan } from '../implscan.ts';

export interface Notifier extends ImplScan {
  notify(message: string): string;
}
