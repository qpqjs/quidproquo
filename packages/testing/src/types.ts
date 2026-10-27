// Test utility types
export interface GeneratorTestStep<T = any> {
  yields?: T;
  given?: any;
  returns?: any;
}

export type GeneratorTestSequence<T = any> = GeneratorTestStep<T>[];
