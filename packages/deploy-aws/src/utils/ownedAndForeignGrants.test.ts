import { defineSecret } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getForeignConfigs } from './ownedAndForeignGrants';

describe('getForeignConfigs', () => {
  it('keeps only the settings another service owns', () => {
    const own = defineSecret('own');
    const foreign = defineSecret('theirs', { owner: { module: 'other-service' } });

    expect(getForeignConfigs([own, foreign], buildTestQpqConfig())).toEqual([foreign]);
  });
});
