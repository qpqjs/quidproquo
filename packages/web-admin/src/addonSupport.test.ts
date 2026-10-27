import { describe, expect, it } from 'vitest';

import { createAddon } from './addonSupport';

describe('createAddon', () => {
  it('wraps a tab view into a federated addon', () => {
    const View = () => null;

    const addon = createAddon('Reports', View);

    expect(addon).toEqual({
      tab: { name: 'Reports', View },
      isQpqAdminFederatedAddon: true,
    });
  });
});
