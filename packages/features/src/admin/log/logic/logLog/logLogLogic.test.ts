import { describe, expect, it } from 'vitest';

import { askLogLogGetAll } from './askLogLogGetAll';
import { logLogLogic } from './logLogLogic';

describe('logLogLogic', () => {
  it('exposes askLogLogGetAll', () => {
    expect(logLogLogic.askLogLogGetAll).toBe(askLogLogGetAll);
  });
});
