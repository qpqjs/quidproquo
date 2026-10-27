import { describe, expect, it } from 'vitest';

import { getFederatedKeyFromQpqFunctionRuntime } from './getFederatedKeyFromQpqFunctionRuntime';

describe('getFederatedKeyFromQpqFunctionRuntime', () => {
  it('returns a relative path string runtime unchanged', () => {
    expect(getFederatedKeyFromQpqFunctionRuntime('/entry/controller::onAuth')).toBe('/entry/controller::onAuth');
  });

  it('composes the key from relativePath and functionName, excluding basePath', () => {
    expect(getFederatedKeyFromQpqFunctionRuntime({ basePath: '/base', relativePath: 'service/entry', functionName: 'onAuth' })).toBe(
      'service/entry::onAuth',
    );
  });

  it('produces the same key for the same runtime on different machines (different basePath)', () => {
    const onMachineA = getFederatedKeyFromQpqFunctionRuntime({ basePath: '/home/ci/repo/src', relativePath: 'service/entry', functionName: 'fn' });
    const onMachineB = getFederatedKeyFromQpqFunctionRuntime({ basePath: 'E:/repo/project/src', relativePath: 'service/entry', functionName: 'fn' });

    expect(onMachineA).toBe(onMachineB);
  });

  it('normalizes windows backslashes in the relative path', () => {
    expect(getFederatedKeyFromQpqFunctionRuntime({ basePath: '/base', relativePath: 'service\\entry', functionName: 'fn' })).toBe(
      'service/entry::fn',
    );
  });

  it('strips a leading slash from the relative path', () => {
    expect(getFederatedKeyFromQpqFunctionRuntime({ basePath: '/base', relativePath: '/service/entry', functionName: 'fn' })).toBe(
      'service/entry::fn',
    );
  });

  it('gives leading-slash and slash-free relative paths the same key', () => {
    const withSlash = getFederatedKeyFromQpqFunctionRuntime({ basePath: '/base', relativePath: '/service/entry', functionName: 'fn' });
    const withoutSlash = getFederatedKeyFromQpqFunctionRuntime({ basePath: '/base', relativePath: 'service/entry', functionName: 'fn' });

    expect(withSlash).toBe(withoutSlash);
  });

  it('produces different keys for different function names in the same file', () => {
    expect(getFederatedKeyFromQpqFunctionRuntime({ basePath: '/base', relativePath: 'service/entry', functionName: 'fnA' })).not.toBe(
      getFederatedKeyFromQpqFunctionRuntime({ basePath: '/base', relativePath: 'service/entry', functionName: 'fnB' }),
    );
  });
});
