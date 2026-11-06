import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { FeePanelComponent } from '../fees/fee-panel.component';

describe('fallback: fee selection', () => {
  async function setup() {
    TestBed.configureTestingModule({ providers: [...appConfig.providers, provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(FeePanelComponent);
    await fixture.whenStable();
    return { fixture, text: () => fixture.nativeElement.querySelector('[data-testid=fee]').textContent };
  }

  it('shows the standard fee while the profile loads', async () => {
    const t = await setup();
    expect(t.text()).toBe('3');
  });

  for (const [vip, country, fee] of [
    [true, 'CH', '1'],
    [true, 'DE', '1'],
    [false, 'CH', '2'],
    [false, 'DE', '3'],
  ] as const) {
    it(`vip=${vip} country=${country} pays ${fee}`, async () => {
      const t = await setup();
      TestBed.inject(HttpTestingController).expectOne('/api/profile').flush({ vip, country });
      await t.fixture.whenStable();
      expect(t.text()).toBe(fee);
    });
  }
});
