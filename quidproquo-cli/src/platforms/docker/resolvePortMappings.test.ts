import { describe, expect, it } from 'vitest';

import { resolvePortMappings } from './resolvePortMappings';

describe('resolvePortMappings', () => {
  it('defaults to 80 for the site plus every container port on itself', () => {
    expect(resolvePortMappings('local', {}, [8080, 8888, 3090])).toEqual([
      { host: 80, container: 8080 },
      { host: 8080, container: 8080 },
      { host: 8888, container: 8888 },
      { host: 3090, container: 3090 },
    ]);
  });

  it('keeps the deployment mappings when they target listening ports', () => {
    const portMappings = [{ host: 9000, container: 3090 }];

    expect(resolvePortMappings('local', { portMappings }, [8080, 3090])).toBe(portMappings);
  });

  it('names the deployment when a mapping targets a port the image does not listen on', () => {
    expect(() => resolvePortMappings('local', { portMappings: [{ host: 9000, container: 3090 }] }, [8080])).toThrow(
      "Invalid docker deployment 'local': Port mapping(s) '9000:3090' target ports the image does not listen on (8080)",
    );
  });
});
