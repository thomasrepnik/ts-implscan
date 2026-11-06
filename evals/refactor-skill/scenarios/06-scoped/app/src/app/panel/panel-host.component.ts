import { Component } from '@angular/core';
import { PaymentPanelComponent } from './payment-panel.component';

@Component({
  selector: 'app-panel-host',
  imports: [PaymentPanelComponent],
  template: '<app-payment-panel id="first" /><app-payment-panel id="second" />',
})
export class PanelHostComponent {}
