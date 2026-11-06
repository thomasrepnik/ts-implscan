import { Component, computed, inject, OnInit } from '@angular/core';
import { FeeService } from './fee.service';
import { ProfileStore } from './profile-store';

@Component({
  selector: 'app-fee-panel',
  template: '<output data-testid="fee">{{ fee() }}</output>',
})
export class FeePanelComponent implements OnInit {
  private readonly fees = inject(FeeService);
  private readonly profiles = inject(ProfileStore);
  readonly fee = computed(() => this.fees.fee(100));

  ngOnInit(): void {
    this.profiles.load();
  }
}
