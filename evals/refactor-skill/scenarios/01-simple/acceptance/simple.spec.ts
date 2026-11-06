import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { ReceiptPanelComponent } from '../receipt/receipt-panel.component';
import { ReceiptSettings } from '../receipt/receipt-settings';

describe('simple: format selection', () => {
  async function exportAs(fixture: any) {
    fixture.nativeElement.querySelector('[data-testid=export]').click();
    await fixture.whenStable();
    return fixture.nativeElement.querySelector('[data-testid=result]').textContent;
  }

  it('follows the selected format on every call', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    const fixture = TestBed.createComponent(ReceiptPanelComponent);
    const settings = TestBed.inject(ReceiptSettings);
    expect(await exportAs(fixture)).toBe('receipt.pdf: PDF[a|b]');
    settings.format.set('csv');
    expect(await exportAs(fixture)).toBe('receipt.csv: a,b');
    settings.format.set('pdf');
    expect(await exportAs(fixture)).toBe('receipt.pdf: PDF[a|b]');
  });
});
