import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { CompletionComponent } from '../receipt/completion.component';

describe('refuse: both channels', () => {
  it('still prints and mails, and resend repeats the mail', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    const fixture = TestBed.createComponent(CompletionComponent);
    const el = fixture.nativeElement;
    el.querySelector('[data-testid=complete]').click();
    await fixture.whenStable();
    expect(el.querySelector('[data-testid=result]').textContent).toContain('[printer]');
    expect(el.querySelector('[data-testid=result]').textContent).toContain('[mail to');
    el.querySelector('[data-testid=resend]').click();
    await fixture.whenStable();
    expect(el.querySelector('[data-testid=result]').textContent).toBe('[mail to a@example.invalid]\n1. coffee\nTotal: 4.50');
  });
});
