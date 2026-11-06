import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { CheckoutComponent } from './checkout.component';

describe('CheckoutComponent', () => {
  it('adds a fee to a card payment', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    const fixture = TestBed.createComponent(CheckoutComponent);
    const el: HTMLElement = fixture.nativeElement;
    const click = (id: string) => (el.querySelector(`[data-testid=${id}]`) as HTMLElement).click();
    click('begin');
    click('fee');
    click('show');
    await fixture.whenStable();
    expect(el.querySelector('[data-testid=summary]')!.textContent).toBe('card:105');
  });
});
