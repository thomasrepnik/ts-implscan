/**
 * Marker interface: every interface that extends `ImplScan` gets its implementations
 * collected by the `ts-implscan` CLI. It has no members and no runtime cost.
 *
 * @example
 * export interface PaymentHandler extends ImplScan {
 *   pay(amount: number): string;
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ImplScan {}
