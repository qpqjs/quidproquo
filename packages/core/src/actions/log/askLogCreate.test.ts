import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { LogLevelEnum } from '../../types/LogLevelEnum';
import { askLogCreate } from './askLogCreate';
import { LogActionType } from './LogActionType';

describe('askLogCreate', () => {
  it('yields a Create action with the level, message and data', () => {
    const { action } = captureRequester(askLogCreate(LogLevelEnum.Info, 'hello', { extra: true }));

    expect(action).toEqual({
      type: LogActionType.Create,
      payload: {
        logLevel: LogLevelEnum.Info,
        msg: 'hello',
        data: { extra: true },
      },
    });
  });

  it('maps data to undefined when omitted', () => {
    const { action } = captureRequester(askLogCreate(LogLevelEnum.Error, 'boom'));

    expect(action).toEqual({
      type: LogActionType.Create,
      payload: {
        logLevel: LogLevelEnum.Error,
        msg: 'boom',
        data: undefined,
      },
    });
  });

  it('propagates a logging failure as a thrown error', () => {
    const run = () =>
      runStory(askLogCreate(LogLevelEnum.Info, 'hello'), {
        [LogActionType.Create]: throwsError('GenericError', 'log sink unavailable'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('log sink unavailable');
  });
});
