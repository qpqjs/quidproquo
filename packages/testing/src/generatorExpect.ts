type GeneratorStep = {
  type: 'yield' | 'return';
  value: any;
  input?: any;
};

export class GeneratorExpectChain<T = any> {
  private steps: GeneratorStep[] = [];
  private lastInput: any;
  // `any` because this is the host test framework's expect function; typing it
  // would couple this framework-agnostic chain to vitest's types.
  private expect: any;

  constructor(
    private generator: Generator<any, any, any>,
    expect?: any,
  ) {
    this.expect = expect || (globalThis as any).expect;
    if (!this.expect) {
      throw new Error('expect function not found. Please ensure Vitest or another test framework is available.');
    }
  }

  toYield(expected: any): this {
    const { value, done } = this.generator.next();
    this.expect(done).toBe(false);
    this.expect(value).toEqual(expected);
    this.steps.push({ type: 'yield', value });
    return this;
  }

  // Alias of toYield kept for published-API compatibility.
  toYieldAction(expected: any): this {
    return this.toYield(expected);
  }

  whenGiven(input: any): this {
    this.lastInput = input;
    return this;
  }

  // Aliases of whenGiven kept for published-API compatibility.
  andReceive(input: any): this {
    return this.whenGiven(input);
  }

  withResponse(input: any): this {
    return this.whenGiven(input);
  }

  thenYield(expected: any): this {
    const { value, done } = this.generator.next(this.lastInput);
    this.expect(done).toBe(false);
    this.expect(value).toEqual(expected);
    this.steps.push({ type: 'yield', value, input: this.lastInput });
    this.lastInput = undefined;
    return this;
  }

  thenReturn(expected: any): void {
    const { value, done } = this.generator.next(this.lastInput);
    this.expect(done).toBe(true);
    this.expect(value).toStrictEqual(expected);
    this.steps.push({ type: 'return', value, input: this.lastInput });
  }

  // Alternative terminator that doesn't check the return value
  thenComplete(): void {
    const { done } = this.generator.next(this.lastInput);
    this.expect(done).toBe(true);
  }

  // For debugging - returns current execution steps
  getSteps(): GeneratorStep[] {
    return [...this.steps];
  }

  // Snapshot support for recording generator behavior
  toMatchSnapshot(name?: string): void {
    this.expect(this.steps).toMatchSnapshot(name);
  }
}

/** Drive a generator step by step, asserting each yielded action and the final return. */
export function expectGenerator<T>(gen: Generator<any, T, any>, expect?: any): GeneratorExpectChain<T> {
  return new GeneratorExpectChain(gen, expect);
}
