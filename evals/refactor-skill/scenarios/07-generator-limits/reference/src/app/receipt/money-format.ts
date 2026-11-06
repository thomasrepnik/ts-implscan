import { InjectionToken } from '@angular/core';

export const MONEY_FORMAT = new InjectionToken<(amount: number) => string>('MONEY_FORMAT');
