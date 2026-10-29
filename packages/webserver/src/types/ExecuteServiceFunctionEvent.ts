export type ExecuteServiceFunctionEvent<T> = {
  functionName: string;
  payload: T;
};
