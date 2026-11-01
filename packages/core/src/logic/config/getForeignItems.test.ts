import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { defineSecret } from '../../config/settings/secret';
import { getForeignItems } from './getForeignItems';

describe('getForeignItems', () => {
  it('keeps only the settings another service owns', () => {
    const own = defineSecret('own');
    const foreign = defineSecret('theirs', { owner: { module: 'other-service' } });

    expect(getForeignItems([own, foreign], buildTestQpqConfig())).toEqual([foreign]);
  });
});
