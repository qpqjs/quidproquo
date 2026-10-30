import { describe, expect, it } from 'vitest';

import { getUserScriptChildEnv } from './getUserScriptChildEnv';

// Security regression: a developer's shell carries real cloud credentials; none of them may reach a user script.
describe('getUserScriptChildEnv', () => {
  it('drops every AWS_* variable and keeps the rest', () => {
    const env = getUserScriptChildEnv({
      AWS_ACCESS_KEY_ID: 'k',
      AWS_SECRET_ACCESS_KEY: 's',
      AWS_SESSION_TOKEN: 't',
      AWS_PROFILE: 'dev',
      AWS_REGION: 'ap-southeast-2',
      PATH: '/usr/bin',
      HOME: '/home/dev',
      NODE_OPTIONS: '--enable-source-maps',
    });

    expect(Object.keys(env).sort()).toEqual(['HOME', 'NODE_OPTIONS', 'PATH']);
    expect(Object.keys(env).some((key) => key.startsWith('AWS_'))).toBe(false);
  });

  it('never passes an AWS_* variable through even when it is the only one set', () => {
    expect(getUserScriptChildEnv({ AWS_SECRET_ACCESS_KEY: 's' })).toEqual({});
  });
});
