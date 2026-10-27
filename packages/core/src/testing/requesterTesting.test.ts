import { describe, expect, it } from 'vitest';

import { AskResponse } from '../types';
import { captureRequester } from './requesterTesting';

describe('captureRequester', () => {
  it('captures the single action a requester yields', () => {
    function* requester(): AskResponse<string> {
      return yield { type: 'Demo/Action', payload: { id: 'abc' } };
    }

    const { action } = captureRequester(requester());

    expect(action).toEqual({ type: 'Demo/Action', payload: { id: 'abc' } });
  });

  it('passes the runtime result straight through as the return value', () => {
    function* requester(): AskResponse<string> {
      return yield { type: 'Demo/Action' };
    }

    const { returned } = captureRequester(requester(), 'resolved-value');

    expect(returned).toBe('resolved-value');
  });

  it('throws when the requester returns without yielding an action', () => {
    function* nothing(): AskResponse<void> {}

    expect(() => captureRequester(nothing())).toThrow(/yield an action/);
  });

  it('throws when the requester yields more than one action', () => {
    function* twice(): AskResponse<void> {
      yield { type: 'Demo/First' };
      yield { type: 'Demo/Second' };
    }

    expect(() => captureRequester(twice())).toThrow(/single action/);
  });
});
