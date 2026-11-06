import type { Dispatchable } from '@thomasrepnik/ts-implscan';
import type { Profile } from './profile-store';

export interface FeeContext {
  profile: Profile | undefined;
}

export interface FeeCalculator extends Dispatchable<FeeContext> {
  fee(amount: number): number;
}
