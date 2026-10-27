export interface CrossModuleMessage<T> {
  type: string;
  payload: T;
}
