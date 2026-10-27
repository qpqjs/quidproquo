import { describe, expect, it } from 'vitest';

import { buildMcpRemoteToolName } from './buildMcpRemoteToolName';
import { parseMcpRemoteToolName } from './parseMcpRemoteToolName';

describe('parseMcpRemoteToolName', () => {
  it('strips the prefix buildMcpRemoteToolName added', () => {
    expect(parseMcpRemoteToolName('template', buildMcpRemoteToolName('template', 'set_layout'))).toBe('set_layout');
  });

  // Security regression: the prefix match is exact (prefix plus separator), so a toolset never claims a sibling's tools
  // and the remainder is handed over exactly as written, separators included.
  it('matches the prefix exactly and hands the remainder over verbatim', () => {
    expect(parseMcpRemoteToolName('temp', 'template_describe')).toBeNull();
    expect(parseMcpRemoteToolName('template', 'template__inner')).toBe('_inner');
    expect(parseMcpRemoteToolName('template', 'template_a_b_c')).toBe('a_b_c');
    expect(parseMcpRemoteToolName('template', 'Template_describe')).toBeNull();
  });

  it('is null for a name without this prefix, or with nothing after it', () => {
    expect(parseMcpRemoteToolName('template', 'flow_describe')).toBeNull();
    expect(parseMcpRemoteToolName('template', 'templateX_describe')).toBeNull();
    expect(parseMcpRemoteToolName('template', 'template_')).toBeNull();
  });
});
