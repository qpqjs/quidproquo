import {
  buildTestQpqConfig,
  ConfigActionType,
  ContextActionType,
  DateActionType,
  ErrorActionType,
  GuidActionType,
  LogActionType,
  MathActionType,
  MetricActionType,
  NetworkActionType,
  PlatformActionType,
  SystemActionType,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getCoreActionProcessor } from './index';

describe('getCoreActionProcessor', () => {
  it('exposes a processor for every core action domain', async () => {
    const apl = await getCoreActionProcessor(buildTestQpqConfig(), async () => null);

    const expectedActionTypes = [
      ConfigActionType.GetApplicationInfo,
      ConfigActionType.GetGlobal,
      ContextActionType.List,
      ContextActionType.Read,
      DateActionType.Now,
      ErrorActionType.ThrowError,
      GuidActionType.New,
      GuidActionType.NewSortable,
      GuidActionType.NewSortableMany,
      LogActionType.Create,
      LogActionType.DisableEventHistory,
      LogActionType.TemplateLiteral,
      MathActionType.RandomNumber,
      MetricActionType.Put,
      NetworkActionType.Request,
      PlatformActionType.Delay,
      SystemActionType.Batch,
      SystemActionType.GetRuntimeCorrelation,
    ];

    for (const actionType of expectedActionTypes) {
      expect(typeof apl[actionType], actionType).toBe('function');
    }
  });
});
