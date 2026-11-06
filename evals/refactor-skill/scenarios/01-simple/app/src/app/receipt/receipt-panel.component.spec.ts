import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { ReceiptPanelComponent } from './receipt-panel.component';

describe('ReceiptPanelComponent', () => {
  it('exports as pdf by default', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    const fixture = TestBed.createComponent(ReceiptPanelComponent);
    fixture.nativeElement.querySelector('[data-testid=export]').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-testid=result]').textContent).toBe('receipt.pdf: PDF[a|b]');
  });
});
