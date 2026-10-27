import { describe, expect, it } from 'vitest';

import { getFederatedContainerName } from './getFederatedContainerName';

describe('getFederatedContainerName', () => {
  it('sanitizes the service name into a valid js identifier', () => {
    expect(getFederatedContainerName('my-cool-service')).toBe('qpq_my_cool_service');
  });
});
