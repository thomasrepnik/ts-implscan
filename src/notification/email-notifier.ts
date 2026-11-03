import type { Notifier } from './notifier.ts';

export class EmailNotifier implements Notifier {
  notify(message: string) {
    return `email: ${message}`;
  }
}
