import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../app.config';

describe('export route', () => {
  it('exports a pdf after lazy navigation', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/export');
    const el: HTMLElement = harness.routeNativeElement!;
    (el.querySelector('[data-testid=run]') as HTMLElement).click();
    await harness.fixture.whenStable();
    expect(el.querySelector('[data-testid=result]')!.textContent).toContain('pdf:10:');
    expect(TestBed.inject(Router).url).toBe('/export');
  });
});
