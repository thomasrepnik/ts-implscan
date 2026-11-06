import { inject, Injectable } from '@angular/core';
import type { DispatchContextProvider } from '@thomasrepnik/ts-implscan';
import type { FeeContext } from './fee-calculator';
import { ProfileStore } from './profile-store';

@Injectable()
export class FeeContextProvider implements DispatchContextProvider<FeeContext> {
  private readonly profiles = inject(ProfileStore);

  get(): FeeContext {
    return { profile: this.profiles.profile() };
  }
}
