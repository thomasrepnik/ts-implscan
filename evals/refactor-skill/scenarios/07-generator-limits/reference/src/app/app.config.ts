import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { CurrencyFormatterDispatcher, provideImplscan } from './generated/implscan-registry';
import { MONEY_FORMAT } from './receipt/money-format';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
    provideImplscan(),
    {
      provide: MONEY_FORMAT,
      useFactory: () => {
        const money = inject(CurrencyFormatterDispatcher);
        return (amount: number) => money.format(amount);
      },
    },
  ],
};
