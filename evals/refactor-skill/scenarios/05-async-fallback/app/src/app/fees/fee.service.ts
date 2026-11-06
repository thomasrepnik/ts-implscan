import { inject, Injectable } from '@angular/core';
import { ProfileStore } from './profile-store';
import { StandardFeeCalculator } from './standard-fee-calculator';
import { SwissFeeCalculator } from './swiss-fee-calculator';
import { VipFeeCalculator } from './vip-fee-calculator';

@Injectable({ providedIn: 'root' })
export class FeeService {
  private readonly profiles = inject(ProfileStore);
  private readonly vip = inject(VipFeeCalculator);
  private readonly swiss = inject(SwissFeeCalculator);
  private readonly standard = inject(StandardFeeCalculator);

  fee(amount: number): number {
    const profile = this.profiles.profile();
    if (profile?.vip) {
      return this.vip.fee(amount);
    } else if (profile?.country === 'CH') {
      return this.swiss.fee(amount);
    }
    return this.standard.fee(amount);
  }
}
