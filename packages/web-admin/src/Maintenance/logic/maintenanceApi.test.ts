import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchMaintenanceSummaries } from './maintenanceApi';

const apiRequestGet = vi.fn();

// Only the network wrapper is replaced.
vi.mock('../../logic/platform/apiRequest', async (importOriginal: <T>() => Promise<T>) => ({
  ...(await importOriginal<object>()),
  apiRequestGet: (...args: unknown[]) => apiRequestGet(...args),
}));

// The list route answers a page ({ items, nextPageKey }), never a bare array. The list screen maps over what this
// returns, so handing it the page object crashes the screen.
describe('fetchMaintenanceSummaries', () => {
  beforeEach(() => {
    apiRequestGet.mockReset();
  });

  it('returns the summaries of a single page as an array', async () => {
    apiRequestGet.mockResolvedValueOnce({ items: [{ id: 'm-1' }] });

    expect(await fetchMaintenanceSummaries('https://api', 'token')).toEqual([{ id: 'm-1' }]);
    expect(apiRequestGet).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when there are no maintenances', async () => {
    apiRequestGet.mockResolvedValueOnce({ items: [] });

    expect(await fetchMaintenanceSummaries('https://api')).toEqual([]);
  });

  it('follows the page cursor until the collection runs out', async () => {
    apiRequestGet.mockResolvedValueOnce({ items: [{ id: 'm-1' }], nextPageKey: 'page 2' }).mockResolvedValueOnce({ items: [{ id: 'm-2' }] });

    expect(await fetchMaintenanceSummaries('https://api', 'token')).toEqual([{ id: 'm-1' }, { id: 'm-2' }]);
    expect(apiRequestGet.mock.calls.map((call: unknown[]) => call[0])).toEqual(['/v1/maintenance', '/v1/maintenance?nextPageKey=page%202']);
  });
});
