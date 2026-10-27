import { describe, expect, it } from 'vitest';

import './vitestMatchers';

function* singleYield(): Generator<any, string, any> {
  const input = yield { type: 'ACTION' };
  return input;
}

function* immediateReturn(): Generator<any, string, any> {
  return 'done';
}

function* twoYields(): Generator<any, string, any> {
  yield { type: 'A' };
  const last = yield { type: 'B' };
  return last;
}

describe('toYieldValue', () => {
  it('passes when the generator yields the expected value', () => {
    expect(singleYield()).toYieldValue({ type: 'ACTION' });
  });

  it('negates when the generator yields a different value', () => {
    expect(singleYield()).not.toYieldValue({ type: 'OTHER' });
  });

  it('fails when the yielded value does not match', () => {
    expect(() => expect(singleYield()).toYieldValue({ type: 'OTHER' })).toThrow();
  });

  it('fails when the generator completes instead of yielding', () => {
    expect(() => expect(immediateReturn()).toYieldValue({ type: 'ACTION' })).toThrow();
  });
});

describe('toCompleteWith', () => {
  it('passes when the generator returns the expected value', () => {
    expect(immediateReturn()).toCompleteWith('done');
  });

  it('negates when the generator returns a different value', () => {
    expect(immediateReturn()).not.toCompleteWith('other');
  });

  it('fails when the returned value does not match', () => {
    expect(() => expect(immediateReturn()).toCompleteWith('other')).toThrow();
  });

  it('fails when the generator yields instead of completing', () => {
    expect(() => expect(singleYield()).toCompleteWith('done')).toThrow();
  });
});

function* echoInput(): Generator<any, string, any> {
  const first = yield { type: 'FIRST' };
  const second = yield { type: 'SECOND', payload: first };
  return second;
}

describe('toYieldSequence', () => {
  it('passes for a matching yield and return sequence', () => {
    expect(twoYields()).toYieldSequence([{ yields: { type: 'A' } }, { yields: { type: 'B' }, given: 'final' }, { returns: 'final' }]);
  });

  it('feeds a step given into the following yield, not just a following return', () => {
    expect(echoInput()).toYieldSequence([
      { yields: { type: 'FIRST' }, given: 'fed' },
      { yields: { type: 'SECOND', payload: 'fed' }, given: 'done' },
      { returns: 'done' },
    ]);
  });

  it('negates a non-matching sequence', () => {
    expect(twoYields()).not.toYieldSequence([{ yields: { type: 'WRONG' } }]);
  });

  it('fails when a yielded value does not match', () => {
    expect(() => expect(twoYields()).toYieldSequence([{ yields: { type: 'WRONG' } }])).toThrow();
  });

  it('fails when the generator completes before an expected yield', () => {
    expect(() => expect(immediateReturn()).toYieldSequence([{ yields: { type: 'A' } }])).toThrow();
  });

  it('fails when the returned value does not match', () => {
    expect(() => expect(twoYields()).toYieldSequence([{ yields: { type: 'A' } }, { yields: { type: 'B' } }, { returns: 'wrong' }])).toThrow();
  });

  it('fails when the generator yields instead of completing', () => {
    expect(() => expect(twoYields()).toYieldSequence([{ yields: { type: 'A' } }, { returns: 'early' }])).toThrow();
  });
});
