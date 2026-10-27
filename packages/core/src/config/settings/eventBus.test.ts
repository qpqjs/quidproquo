import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineEventBus } from './eventBus';

describe('defineEventBus', () => {
  it('builds an EventBus setting with the given name and defaults deprecated to false', () => {
    expect(defineEventBus('Events')).toEqual({
      configSettingType: QPQCoreConfigSettingType.eventBus,
      uniqueKey: 'Events',
      name: 'Events',
      deprecated: false,
      owner: undefined,
      isFifo: false,
    });
  });

  it('coerces a truthy deprecated option to a boolean', () => {
    expect(defineEventBus('Events', { deprecated: true }).deprecated).toBe(true);
  });

  it('applies isFifo when supplied', () => {
    expect(defineEventBus('Events', { isFifo: true }).isFifo).toBe(true);
  });
});
