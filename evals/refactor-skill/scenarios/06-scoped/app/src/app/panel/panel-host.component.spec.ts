import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { PanelHostComponent } from './panel-host.component';

describe('PanelHostComponent', () => {
  it('submits a card payment in the first panel', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    const fixture = TestBed.createComponent(PanelHostComponent);
    await fixture.whenStable();
    const first: HTMLElement = fixture.nativeElement.querySelector('#first');
    (first.querySelector('.submit') as HTMLElement).click();
    await fixture.whenStable();
    expect(first.querySelector('.result')!.textContent).toBe('card#1:10');
  });
});
