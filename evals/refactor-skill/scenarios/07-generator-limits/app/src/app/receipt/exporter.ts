export interface Receipt {
  total: number;
}

export interface Exporter<T> {
  export(value: T): string;
}
