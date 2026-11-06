import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { FeePanelComponent } from './fee-panel.component';

describe('FeePanelComponent', () => {
  it('shows the swiss fee once the profile is loaded', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers, provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(FeePanelComponent);
    await fixture.whenStable();
    TestBed.inject(HttpTestingController).expectOne('/api/profile').flush({ vip: false, country: 'CH' });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-testid=fee]').textContent).toBe('2');
  });
});
