// Test utility types
export type GeneratorTestStep<T = any> = {
  yields?: T;
  given?: any;
  returns?: any;
};

export type GeneratorTestSequence<T = any> = GeneratorTestStep<T>[];
