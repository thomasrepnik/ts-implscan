import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CardHandler {
  pay(amount: number): Observable<string> {
    return of(`card:${amount}`);
  }
}
