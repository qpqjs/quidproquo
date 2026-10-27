import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, UserDirectoryActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { associateSoftwareToken } from '../../../logic/cognito/associateSoftwareToken';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getUserDirectoryAssociateSoftwareTokenActionProcessor } from './getUserDirectoryAssociateSoftwareTokenActionProcessor';

vi.mock('../../../logic/cognito/associateSoftwareToken', () => ({
  associateSoftwareToken: vi.fn(),
}));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
  const processors = await getUserDirectoryAssociateSoftwareTokenActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.AssociateSoftwareToken];
};

describe('getUserDirectoryAssociateSoftwareTokenActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(associateSoftwareToken).mockReset();
  });

  it('associates the software token for the given session', async () => {
    vi.mocked(associateSoftwareToken).mockResolvedValue({ secretCode: 'abc' } as any);
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { session: 'sess' });

    expect(result).toEqual([{ secretCode: 'abc' }]);
    expect(associateSoftwareToken).toHaveBeenCalledWith('eu-west-1', 'sess');
  });
});
