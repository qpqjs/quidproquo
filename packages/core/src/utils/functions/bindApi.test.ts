import { describe, expect, it } from 'vitest';

import { AskResponse } from '../../types';
import { bindApi } from './bindApi';

type Deps = { prefix: string };

function* greet(deps: Deps, name: string): AskResponse<string> {
  return `${deps.prefix}${name}`;
}

function* shout(deps: Deps): AskResponse<string> {
  return deps.prefix.toUpperCase();
}

describe('bindApi', () => {
  it('binds the dependencies into every function', () => {
    const api = bindApi({ prefix: 'Hi ' }, { greet, shout });

    expect(api.greet('Joe').next().value).toBe('Hi Joe');
    expect(api.shout().next().value).toBe('HI ');
  });

  it('preserves the set of function keys', () => {
    const api = bindApi({ prefix: '' }, { greet, shout });

    expect(Object.keys(api)).toEqual(['greet', 'shout']);
  });

  it('returns an empty object for no functions', () => {
    expect(bindApi({ prefix: '' }, {})).toEqual({});
  });
});
