import { describe, expect, it, vi } from 'vitest';

import { findRootLog } from './findRootLog';

const apiRequestGet = vi.fn();

vi.mock('../../logic', () => ({
  cache: (fn: unknown) => fn,
  apiRequestGet: (...args: unknown[]) => apiRequestGet(...args),
}));

describe('findRootLog', () => {
  it('returns undefined without requesting when no correlation is given', async () => {
    const result = await findRootLog('https://api');

    expect(result).toBeUndefined();
    expect(apiRequestGet).not.toHaveBeenCalled();
  });

  it('walks fromCorrelation up to the root log', async () => {
    apiRequestGet
      .mockResolvedValueOnce({ correlation: 'child', fromCorrelation: 'root-id' })
      .mockResolvedValueOnce({ correlation: 'root', fromCorrelation: undefined });

    const result = await findRootLog('https://api', 'child-id');

    expect(result).toEqual({ correlation: 'root', fromCorrelation: undefined });
  });

  it('returns undefined when a request throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    apiRequestGet.mockRejectedValue(new Error('boom'));

    const result = await findRootLog('https://api', 'broken-id');

    expect(result).toBeUndefined();
  });
});
