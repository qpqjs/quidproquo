import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getLogHierarchy } from './getLogHierarchy';

const apiRequestGet = vi.fn();
const externalRequestGet = vi.fn();

vi.mock('../../logic', () => ({
  apiRequestGet: (...args: unknown[]) => apiRequestGet(...args),
  externalRequestGet: (...args: unknown[]) => externalRequestGet(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getLogHierarchy', () => {
  it('returns undefined when no correlation is given', async () => {
    const result = await getLogHierarchy('https://api');

    expect(result).toBeUndefined();
    expect(apiRequestGet).not.toHaveBeenCalled();
  });

  it('fetches the hierarchy report from the signed url', async () => {
    apiRequestGet.mockResolvedValue({ url: 'https://signed/report.json' });
    externalRequestGet.mockResolvedValue({ correlation: 'root', children: [] });

    const result = await getLogHierarchy('https://api', 'corr', true, 'token');

    expect(apiRequestGet).toHaveBeenCalledWith('/log/corr/hierarchies?refresh=true', 'https://api', 'token');
    expect(externalRequestGet).toHaveBeenCalledWith('https://signed/report.json');
    expect(result).toEqual({ correlation: 'root', children: [] });
  });

  it('returns undefined when there is no report url', async () => {
    apiRequestGet.mockResolvedValue({ url: '' });

    const result = await getLogHierarchy('https://api', 'corr2');

    expect(result).toBeUndefined();
    expect(externalRequestGet).not.toHaveBeenCalled();
  });
});
