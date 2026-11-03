export interface PaymentHandler {
  name: string;
  pay(amount: number): string;
}
