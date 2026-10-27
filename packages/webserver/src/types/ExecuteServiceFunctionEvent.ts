export interface ExecuteServiceFunctionEvent<T> {
  functionName: string;
  payload: T;
}
