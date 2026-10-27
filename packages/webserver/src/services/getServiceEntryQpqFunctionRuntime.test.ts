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
});
