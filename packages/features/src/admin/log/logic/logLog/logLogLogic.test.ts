import { describe, expect, it } from 'vitest';

import { askGetLogLogs } from './askGetLogLogs';
import { logLogLogic } from './logLogLogic';

describe('logLogLogic', () => {
  it('exposes askGetLogLogs', () => {
    expect(logLogLogic.askGetLogLogs).toBe(askGetLogLogs);
  });
});
