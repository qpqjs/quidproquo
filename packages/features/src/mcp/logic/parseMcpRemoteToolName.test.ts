import { describe, expect, it } from 'vitest';

import { buildMcpRemoteToolName } from './buildMcpRemoteToolName';
import { parseMcpRemoteToolName } from './parseMcpRemoteToolName';

describe('parseMcpRemoteToolName', () => {
  it('strips the prefix buildMcpRemoteToolName added', () => {
    expect(parseMcpRemoteToolName('template', buildMcpRemoteToolName('template', 'set_layout'))).toBe('set_layout');
  });

  it('is null for a name without this prefix, or with nothing after it', () => {
    expect(parseMcpRemoteToolName('template', 'flow_describe')).toBeNull();
    expect(parseMcpRemoteToolName('template', 'templateX_describe')).toBeNull();
    expect(parseMcpRemoteToolName('template', 'template_')).toBeNull();
  });
});
