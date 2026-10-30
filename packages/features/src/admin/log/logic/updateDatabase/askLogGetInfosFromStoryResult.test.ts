import { LogActionType, LogLevelEnum } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askLogGetInfosFromStoryResult } from './askLogGetInfosFromStoryResult';

describe('askLogGetInfosFromStoryResult', () => {
  it('maps create and template-literal log actions to log infos', () => {
    const result = {
      history: [
        { act: { type: LogActionType.Create, payload: { logLevel: LogLevelEnum.Error, msg: 'boom' } }, startedAt: 't1' },
        { act: { type: LogActionType.TemplateLiteral, payload: { messageParts: [['a ', ' b'], ['x']] } }, startedAt: 't2' },
      ],
    } as any;

    expect(runStory(askLogGetInfosFromStoryResult(result))).toEqual([
      { logLevel: LogLevelEnum.Error, msg: 'boom', startedAt: 't1' },
      { logLevel: LogLevelEnum.Info, msg: 'a x b', startedAt: 't2' },
    ]);
  });
});
