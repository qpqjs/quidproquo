import { describe, expect, it } from 'vitest';

import { getDefaultPortMappings } from './getDefaultPortMappings';
import { assertContainerPorts, parsePortMappings } from './parsePortMappings';

describe('parsePortMappings', () => {
  it('trims and drops empties', () => {
    expect(parsePortMappings(' 8080:8080 ,, 9000:8888 ')).toEqual([
      { host: 8080, container: 8080 },
      { host: 9000, container: 8888 },
    ]);
  });

  it('rejects a malformed pair', () => {
    expect(() => parsePortMappings('80->8080')).toThrow("Port mapping '80->8080' must be host:container");
  });
});

describe('assertContainerPorts', () => {
  it('rejects a container port the image does not listen on', () => {
    expect(() => assertContainerPorts([{ host: 80, container: 3000 }], [8080, 8888])).toThrow(
      "'80:3000' target ports the image does not listen on (8080, 8888)",
    );
  });

  it('accepts known ports', () => {
    expect(() => assertContainerPorts([{ host: 80, container: 8080 }], [8080])).not.toThrow();
  });
});

describe('getDefaultPortMappings', () => {
  it('maps 80 to the site and every container port to itself', () => {
    expect(getDefaultPortMappings([8080, 8888, 8100])).toEqual([
      { host: 80, container: 8080 },
      { host: 8080, container: 8080 },
      { host: 8888, container: 8888 },
      { host: 8100, container: 8100 },
    ]);
  });
});
