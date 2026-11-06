import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { CheckoutComponent } from '../checkout/checkout.component';
import { CheckoutSettings } from '../checkout/checkout-settings';

describe('stateful: a started payment', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    const fixture = TestBed.createComponent(CheckoutComponent);
    const el: HTMLElement = fixture.nativeElement;
    return {
      fixture,
      settings: TestBed.inject(CheckoutSettings),
      click: (id: string) => (el.querySelector(`[data-testid=${id}]`) as HTMLElement).click(),
      summary: async () => {
        (el.querySelector('[data-testid=show]') as HTMLElement).click();
        await fixture.whenStable();
        return el.querySelector('[data-testid=summary]')!.textContent;
      },
    };
  }

  it('shows none and ignores fees before anything has begun', async () => {
    const t = setup();
    t.click('fee');
    expect(await t.summary()).toBe('none');
  });

  it('stays on the method it began with when the selection changes', async () => {
    const t = setup();
    t.click('begin');
    t.click('fee');
    t.settings.method.set('paypal');
    t.click('fee');
    expect(await t.summary()).toBe('card:110');
  });

  it('uses the new method for the next payment', async () => {
    const t = setup();
    t.click('begin');
    t.settings.method.set('paypal');
    t.click('begin');
    t.click('fee');
    expect(await t.summary()).toBe('paypal:105');
  });
});
