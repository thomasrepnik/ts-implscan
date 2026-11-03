import type { Notifier } from './notifier.ts';

export class SmsNotifier implements Notifier {
  notify(message: string) {
    return `sms: ${message}`;
  }
}
