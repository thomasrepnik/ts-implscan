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
export interface Dispatchable<TContext = void> extends ImplScan {
  /** Without a type argument the context is `void`: implementations declare `isApplicableTo()` and decide from their own state. */
  isApplicableTo(context: TContext): boolean;
  /** Optional, defaults to 0. Higher wins when several implementations are applicable; a tie throws. */
  getPriority?(): number;
}

/**
 * Supplies the context for every `Dispatchable<TContext>` interface using the same `TContext`.
 * A class implementing it is found by the CLI like an implementation; with `--target angular`
 * `provideImplscan()` registers it and builds the `<INTERFACE>_CONTEXT` token from it, so the
 * app config needs no provider per interface. `get()` is called on every dispatcher call.
 *
 * @example
 * export class PaymentContextProvider implements DispatchContextProvider<PaymentContext> {
 *   private readonly settings = inject(PAYMENT_SETTINGS);
 *   get(): PaymentContext {
 *     return { method: this.settings.method };
 *   }
 * }
 */
export interface DispatchContextProvider<TContext> {
  get(): TContext;
}
