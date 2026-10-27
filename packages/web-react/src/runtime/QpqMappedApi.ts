import { AskResponse, AskResponseReturnType, Story } from 'quidproquo-core';

// Helper type to remap keys from "askXyz" to "xyz" (with lowercase first letter)
export type RemoveQpqAskPrefix<K extends string> = K extends `ask${infer R}` ? Uncapitalize<R> : never;

export type QpqApi = Record<`ask${string}`, Story<any, any>>;

// Define the mapped API type.
// We extract only string keys and then use a conditional type to infer parameters and return type.
export type QpqMappedApi<TApi extends QpqApi> = {
  [K in Extract<keyof TApi, string> as RemoveQpqAskPrefix<K>]: TApi[K] extends (...args: infer P) => infer R
    ? R extends AskResponse<any>
      ? (...args: P) => Promise<AskResponseReturnType<R>>
      : never
    : never;
};

export const combineQpqApis = <TApiA extends QpqApi, TApiB extends QpqApi>(apiA: TApiA, apiB: TApiB): TApiA & TApiB => {
  return { ...apiA, ...apiB };
};
