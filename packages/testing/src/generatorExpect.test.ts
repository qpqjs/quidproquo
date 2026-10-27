import { describe, expect, it } from 'vitest';

import { expectGenerator, GeneratorExpectChain } from './generatorExpect';

function* simpleGenerator(): Generator<any, string, string> {
  const first = yield { type: 'ACTION_1', payload: 'test' };
  return first;
}

function* multiYieldGenerator(): Generator<any, any, any> {
  const a = yield { type: 'ACTION_A' };
  const b = yield { type: 'ACTION_B', payload: a };
  return { a, b };
}

function* voidGenerator(): Generator<any, void, any> {
  yield { type: 'SIDE_EFFECT' };
}

describe('expectGenerator', () => {
  it('returns a GeneratorExpectChain', () => {
    expect(expectGenerator(simpleGenerator())).toBeInstanceOf(GeneratorExpectChain);
  });

  it('drives a single yield and return', () => {
    expectGenerator(simpleGenerator()).toYield({ type: 'ACTION_1', payload: 'test' }).whenGiven('result').thenReturn('result');
  });

  it('drives multiple sequential yields', () => {
    expectGenerator(multiYieldGenerator())
      .toYield({ type: 'ACTION_A' })
      .whenGiven('valueA')
      .thenYield({ type: 'ACTION_B', payload: 'valueA' })
      .whenGiven('valueB')
      .thenReturn({ a: 'valueA', b: 'valueB' });
  });

  it('completes a void generator with thenComplete', () => {
    expectGenerator(voidGenerator()).toYield({ type: 'SIDE_EFFECT' }).thenComplete();
  });

  describe('alternative input method names', () => {
    it.each([
      ['whenGiven', (chain: GeneratorExpectChain) => chain.whenGiven('result')],
      ['andReceive', (chain: GeneratorExpectChain) => chain.andReceive('result')],
      ['withResponse', (chain: GeneratorExpectChain) => chain.withResponse('result')],
    ])('feeds input via %s', (_label: string, supplyInput: (chain: GeneratorExpectChain) => GeneratorExpectChain) => {
      const chain = expectGenerator(simpleGenerator()).toYieldAction({ type: 'ACTION_1', payload: 'test' });
      supplyInput(chain).thenReturn('result');
    });
  });

  describe('constructor expect resolution', () => {
    it('uses an explicitly provided expect', () => {
      expectGenerator(simpleGenerator(), expect).toYield({ type: 'ACTION_1', payload: 'test' }).whenGiven('result').thenReturn('result');
    });

    it('throws when no expect is available', () => {
      const original = (globalThis as any).expect;
      delete (globalThis as any).expect;
      try {
        expect(() => expectGenerator(simpleGenerator())).toThrow('expect function not found');
      } finally {
        (globalThis as any).expect = original;
      }
    });
  });

  describe('step recording', () => {
    function buildStubExpect() {
      const snapshots: Array<{ value: any; name?: string }> = [];
      const stub: any = () => ({
        toBe: () => undefined,
        toEqual: () => undefined,
        toStrictEqual: () => undefined,
        toMatchSnapshot: (name?: string) => snapshots.push({ value: undefined, name }),
      });
      return { stub, snapshots };
    }

    it('records yield and return steps retrievable via getSteps', () => {
      const chain = expectGenerator(simpleGenerator()).toYield({ type: 'ACTION_1', payload: 'test' }).whenGiven('result');
      chain.thenReturn('result');

      expect(chain.getSteps()).toEqual([
        { type: 'yield', value: { type: 'ACTION_1', payload: 'test' } },
        { type: 'return', value: 'result', input: 'result' },
      ]);
    });

    it('forwards recorded steps to expect().toMatchSnapshot', () => {
      const { stub, snapshots } = buildStubExpect();
      const chain = expectGenerator(simpleGenerator(), stub).toYield({ type: 'ACTION_1', payload: 'test' });

      chain.toMatchSnapshot('my-snapshot');

      expect(snapshots).toEqual([{ value: undefined, name: 'my-snapshot' }]);
    });
  });
});
