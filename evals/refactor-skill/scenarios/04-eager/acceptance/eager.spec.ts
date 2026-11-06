import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { PayButtonComponent } from '../pay/pay-button.component';
import { PaySettings } from '../pay/pay-settings';

describe('eager: paypal session', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [...appConfig.providers, provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(PayButtonComponent);
    return {
      fixture,
      http: TestBed.inject(HttpTestingController),
      pay: () => fixture.nativeElement.querySelector('[data-testid=pay]').click(),
      result: () => fixture.nativeElement.querySelector('[data-testid=result]').textContent,
    };
  }

  it('never opens a paypal session for card payments', async () => {
    const t = setup();
    t.pay();
    await t.fixture.whenStable();
    expect(t.result()).toBe('card:10');
    t.http.expectNone('/api/paypal/session');
  });

  it('opens exactly one session across several paypal payments', async () => {
    const t = setup();
    TestBed.inject(PaySettings).method.set('paypal');
    t.pay();
    t.http.expectOne('/api/paypal/session').flush({ token: 'tok' });
    await t.fixture.whenStable();
    expect(t.result()).toBe('paypal:10:tok');
    t.pay();
    t.http.expectNone('/api/paypal/session');
    await t.fixture.whenStable();
    expect(t.result()).toBe('paypal:10:tok');
  });
});
