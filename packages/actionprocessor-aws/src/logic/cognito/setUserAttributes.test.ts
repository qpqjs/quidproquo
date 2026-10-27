import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAwsClient } from '../createAwsClient';
import { setUserAttributes } from './setUserAttributes';

vi.mock('../createAwsClient', () => ({ createAwsClient: vi.fn() }));

const send = vi.fn();

// Security regression: `userId` maps to Cognito's immutable `sub`, so a caller-supplied id must never reach
// AdminUpdateUserAttributes, where it would be rejected at best and rewrite identity at worst.
describe('setUserAttributes', () => {
  beforeEach(() => {
    send.mockReset().mockResolvedValue({});
    vi.mocked(createAwsClient).mockReturnValue({ send } as any);
  });

  it('never writes userId (sub) back, only the mapped writeable attributes', async () => {
    await setUserAttributes('POOL', 'eu-west-1', 'alice', { userId: 'forged-sub', email: 'a@b.example', firstName: 'A' } as any);

    const command = send.mock.calls[0][0];
    const names = (command.input.UserAttributes as { Name: string }[]).map((attribute) => attribute.Name);
    expect(names).not.toContain('sub');
    expect(names).toContain('email');
    expect(JSON.stringify(command.input)).not.toContain('forged-sub');
  });
});
