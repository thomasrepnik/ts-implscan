import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../app.config';

describe('lazy: export route', () => {
  it('switches between both formats after lazy navigation', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/export');
    const el: HTMLElement = harness.routeNativeElement!;
    const click = (id: string) => (el.querySelector(`[data-testid=${id}]`) as HTMLElement).click();
    const result = async () => {
      click('run');
      await harness.fixture.whenStable();
      return el.querySelector('[data-testid=result]')!.textContent;
    };
    expect(await result()).toContain('pdf:10:');
    click('xml');
    expect(await result()).toContain('xml:10:');
  });
});
