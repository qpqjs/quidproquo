import { describe, expect, it, vi } from 'vitest';

import { findLogDirectChildren } from './findLogDirectChildren';

const apiRequestGet = vi.fn();

vi.mock('../../logic', () => ({
  cache: (fn: unknown) => fn,
  apiRequestGet: (...args: unknown[]) => apiRequestGet(...args),
}));

describe('findLogDirectChildren', () => {
  it('returns the items from the children endpoint', async () => {
    apiRequestGet.mockResolvedValue({ items: [{ correlation: 'c1' }] });

    const result = await findLogDirectChildren('corr-children-ok', 'https://api', 'token');

    expect(apiRequestGet).toHaveBeenCalledWith('/log/children/corr-children-ok', 'https://api', 'token');
    expect(result).toEqual([{ correlation: 'c1' }]);
  });

  it('returns an empty array when the request fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    apiRequestGet.mockRejectedValue(new Error('boom'));

    const result = await findLogDirectChildren('corr-children-fail', 'https://api');

    expect(result).toEqual([]);
  });
});
