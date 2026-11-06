import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { CurrencySettings } from '../money/currency-settings';
import { ExportSettings } from '../receipt/export-settings';
import { ReceiptExportComponent } from '../receipt/receipt-export.component';

describe('generator limits: exporters', () => {
  it('dispatches both ways and follows the currency', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    const fixture = TestBed.createComponent(ReceiptExportComponent);
    const result = async () => {
      fixture.nativeElement.querySelector('[data-testid=run]').click();
      await fixture.whenStable();
      return fixture.nativeElement.querySelector('[data-testid=result]').textContent;
    };
    expect(await result()).toBe('total,CHF 5');
    TestBed.inject(ExportSettings).kind.set('json');
    expect(await result()).toBe('{"total":"CHF 5"}');
    TestBed.inject(CurrencySettings).currency.set('EUR');
    expect(await result()).toBe('{"total":"EUR 5"}');
  });
});
