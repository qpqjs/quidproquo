import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAppServiceNames } from './getAppServiceNames';
import { getAppServiceQpqConfigs } from './getAppServiceQpqConfigs';
import { requireQpqConfig } from './requireQpqConfig';

vi.mock('./getAppServiceNames', () => ({ getAppServiceNames: vi.fn() }));
vi.mock('./requireQpqConfig', () => ({ requireQpqConfig: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('getAppServiceQpqConfigs', () => {
  it('loads a config per service', () => {
    vi.mocked(getAppServiceNames).mockReturnValue(['test', 'testa']);
    vi.mocked(requireQpqConfig).mockImplementation((infra) => [{ infra }] as never);

    expect(getAppServiceQpqConfigs('/root', 'qpqjs')).toHaveLength(2);
  });

  it('warns and carries on when one service fails to load', () => {
    // The rest of the app still runs, which is the point of not throwing per
    // service.
    vi.mocked(getAppServiceNames).mockReturnValue(['test', 'testa']);
    vi.mocked(requireQpqConfig).mockImplementation((infra) => {
      if (infra.includes('testa')) {
        throw new Error('boom');
      }
      return [{ infra }] as never;
    });

    expect(getAppServiceQpqConfigs('/root', 'qpqjs')).toHaveLength(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('throws when every service fails to load', () => {
    // Otherwise the empty list surfaces much later as an unrelated TypeError
    // inside an express listen callback, naming nothing that caused it.
    vi.mocked(getAppServiceNames).mockReturnValue(['test', 'testa']);
    vi.mocked(requireQpqConfig).mockImplementation(() => {
      throw new Error("Cannot find module '@qpqjs/constants'");
    });

    expect(() => getAppServiceQpqConfigs('/root', 'qpqjs')).toThrow(/No service infrastructure could be loaded for app 'qpqjs'/);
    expect(() => getAppServiceQpqConfigs('/root', 'qpqjs')).toThrow(/test, testa/);
  });

  it('returns empty for an app with no services at all', () => {
    // Not the same thing as everything failing, so not an error.
    vi.mocked(getAppServiceNames).mockReturnValue([]);

    expect(getAppServiceQpqConfigs('/root', 'empty')).toEqual([]);
  });
});
