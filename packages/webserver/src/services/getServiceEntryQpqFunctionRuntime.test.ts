import * as path from 'path';
import { describe, expect, it } from 'vitest';

import { getServiceEntryQpqFunctionRuntime } from './getServiceEntryQpqFunctionRuntime';

describe('getServiceEntryQpqFunctionRuntime', () => {
  it('builds the relative path and function name by splitting the runtime on ::', () => {
    const result = getServiceEntryQpqFunctionRuntime('migration', 'deployEvent', 'onDeploy::onDeploy');

    expect(result.relativePath).toBe('migration/entry/deployEvent/onDeploy');
    expect(result.functionName).toBe('onDeploy');
    expect(typeof result.basePath).toBe('string');
  });

  it('uses the src part of the runtime in the relative path', () => {
    const result = getServiceEntryQpqFunctionRuntime('seed', 'controller', 'mySrc::myMethod');

    expect(result.relativePath).toBe('seed/entry/controller/mySrc');
    expect(result.functionName).toBe('myMethod');
  });

  // Security regression: every pointer stays under this package's own compiled services directory with the
  // fixed <service>/entry/<type>/<src> shape; the inputs are framework literals, never request values.
  it('always points under the package services directory with the fixed entry shape', () => {
    const result = getServiceEntryQpqFunctionRuntime('auth', 'controller', 'loginController::login');

    expect(path.basename(result.basePath)).toBe('services');
    expect(result.relativePath).toMatch(/^[a-zA-Z]+\/entry\/[a-zA-Z]+\/[a-zA-Z]+$/);
    expect(path.resolve(result.basePath, result.relativePath).startsWith(result.basePath + path.sep)).toBe(true);
  });
});
