import { TestBed } from '@angular/core/testing';
import { CsvExporter } from './csv-exporter';
import { appConfig } from '../app.config';
import { ReceiptExportComponent } from './receipt-export.component';

describe('CsvExporter', () => {
  it('is the default export of the panel', async () => {
    expect(CsvExporter.name).toBeTruthy();
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    const fixture = TestBed.createComponent(ReceiptExportComponent);
    fixture.nativeElement.querySelector('[data-testid=run]').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-testid=result]').textContent).toBe('total,CHF 5');
  });
});
