import { describe, expect, it } from 'vitest';

import { AskResponse } from '../../types';
import { bindApiFunction } from './bindApiFunction';

type Deps = { prefix: string };

function* greet(deps: Deps, name: string): AskResponse<string> {
  return `${deps.prefix}${name}`;
}

describe('bindApiFunction', () => {
  it('injects the dependencies and forwards the remaining args', () => {
    const bound = bindApiFunction({ prefix: 'Hi ' }, greet);

    expect(bound('Joe').next().value).toBe('Hi Joe');
  });

  it('produces a function that no longer takes the dependencies arg', () => {
    const bound = bindApiFunction({ prefix: '' }, greet);

    expect(bound.length).toBe(0);
  });
});
