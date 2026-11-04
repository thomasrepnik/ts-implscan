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

/**
 * Marker interface for interfaces that need exactly one implementation per call. Besides the
 * list, the CLI generates a `<Interface>Dispatcher` class that forwards every member to the
 * applicable implementation with the highest priority. `isApplicableTo` runs on every call
 * of the dispatcher, so keep it cheap and free of side effects.
 *
 * @example
 * export interface PaymentHandler extends Dispatchable<PaymentContext> {
 *   pay(amount: number): string;
 * }
 */
export interface Dispatchable<TContext> extends ImplScan {
  isApplicableTo(context: TContext): boolean;
  /** Higher wins when several implementations are applicable; a tie throws. */
  getPriority(): number;
}
