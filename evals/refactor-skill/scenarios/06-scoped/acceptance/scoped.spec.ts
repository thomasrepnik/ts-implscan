import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { PanelHostComponent } from '../panel/panel-host.component';

describe('scoped: two panels', () => {
  it('keeps method and count separate per panel', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    const fixture = TestBed.createComponent(PanelHostComponent);
    await fixture.whenStable();
    const first: HTMLElement = fixture.nativeElement.querySelector('#first');
    const second: HTMLElement = fixture.nativeElement.querySelector('#second');
    const click = (el: HTMLElement, cls: string) => (el.querySelector(cls) as HTMLElement).click();
    click(second, '.twint');
    click(first, '.submit');
    click(first, '.submit');
    click(second, '.submit');
    await fixture.whenStable();
    expect(first.querySelector('.result')!.textContent).toBe('card#2:10');
    expect(second.querySelector('.result')!.textContent).toBe('twint#1:10');
  });
});
