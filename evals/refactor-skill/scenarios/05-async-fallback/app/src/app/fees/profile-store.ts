import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

export interface Profile {
  vip: boolean;
  country: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly http = inject(HttpClient);
  readonly profile = signal<Profile | undefined>(undefined);

  load(): void {
    this.http.get<Profile>('/api/profile').subscribe((profile) => this.profile.set(profile));
  }
}
