import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { CompletionComponent } from './completion.component';

describe('CompletionComponent', () => {
  it('prints and mails the receipt', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    const fixture = TestBed.createComponent(CompletionComponent);
    fixture.nativeElement.querySelector('[data-testid=complete]').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-testid=result]').textContent).toBe(
      '[printer]\n1. coffee\nTotal: 4.50\n---\n[mail to a@example.invalid]\n1. coffee\nTotal: 4.50',
    );
  });
});
