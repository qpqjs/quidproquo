import { describe, expect, it } from 'vitest';

import { defineApplication } from '../../applicationName';
import { defineModule } from '../../moduleName';
import { defineParameter } from '../defineParameter';
import { getAllParameterConfigs } from './getAllParameterConfigs';
import { getOwnedParameterConfigs } from './getOwnedParameterConfigs';
import { getParameterByName } from './getParameterByName';
import { resolveParameterOrThrow } from './resolveParameterOrThrow';

const config = [
  defineApplication('app', 'production', 'root'),
  defineModule('svc'),
  defineParameter('mine', { value: '1' }),
  defineParameter('theirs', { owner: { module: 'other', parameterName: 'theirs' } }),
];

describe('parameter accessors', () => {
  it('lists every parameter, and only the owned ones', () => {
    expect(getAllParameterConfigs(config).map((parameter) => parameter.key)).toEqual(['mine', 'theirs']);
    expect(getOwnedParameterConfigs(config).map((parameter) => parameter.key)).toEqual(['mine']);
  });

  it('finds a parameter by name, null when unknown', () => {
    expect(getParameterByName('mine', config)?.value).toBe('1');
    expect(getParameterByName('missing', config)).toBeNull();
  });

  it('resolves a parameter by name or throws naming it', () => {
    expect(resolveParameterOrThrow('theirs', config).key).toBe('theirs');
    expect(() => resolveParameterOrThrow('missing', config)).toThrow('Parameter missing not found');
  });
});
