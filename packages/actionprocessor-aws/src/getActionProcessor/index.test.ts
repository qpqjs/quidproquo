import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { DynamicFunctionsActionType, FileActionType, UserScriptActionType } from '@qpqjs/core';
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getAwsActionProcessors } from './getAwsActionProcessors';

const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);

describe('getAwsActionProcessors', () => {
  // The node core processors are composed in beneath the AWS ones, so anything node
  // adds (dynamic functions, user scripts) is callable from a lambda with no wiring.
  it('composes the node-only processors alongside the AWS ones', async () => {
    const processors = await getAwsActionProcessors(qpqConfig, noopDynamicModuleLoader);

    expect(processors[FileActionType.ReadTextContents]).toBeDefined();
    expect(processors[DynamicFunctionsActionType.Execute]).toBeDefined();
    expect(processors[UserScriptActionType.Execute]).toBeDefined();
    // Building is opt-in per service through defineUserScriptBuilder, never in the base list.
    expect(processors[UserScriptActionType.Build]).toBeUndefined();
  });
});
