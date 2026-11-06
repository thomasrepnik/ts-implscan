import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { PayButtonComponent } from './pay-button.component';

describe('PayButtonComponent', () => {
  it('pays by card', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers, provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(PayButtonComponent);
    fixture.nativeElement.querySelector('[data-testid=pay]').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-testid=result]').textContent).toBe('card:10');
  });
});
