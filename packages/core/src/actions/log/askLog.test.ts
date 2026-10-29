import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askLog } from './askLog';
import { LogActionType } from './LogActionType';

describe('askLog', () => {
  it('yields a TemplateLiteral action splitting strings and variables into messageParts', () => {
    const { action } = captureRequester(askLog`user ${'alice'} did ${'login'}`);

    expect(action).toEqual({
      type: LogActionType.TemplateLiteral,
      payload: {
        messageParts: [
          ['user ', ' did ', ''],
          ['alice', 'login'],
        ],
      },
    });
  });

  it('yields an empty variables list when there are no interpolations', () => {
    const { action } = captureRequester(askLog`static message`);

    expect(action).toEqual({
      type: LogActionType.TemplateLiteral,
      payload: {
        messageParts: [['static message'], []],
      },
    });
  });

  it('propagates a logging failure as a thrown error', () => {
    const run = () =>
      runStory(askLog`boom`, {
        [LogActionType.TemplateLiteral]: throwsError('GenericError', 'log sink unavailable'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('log sink unavailable');
  });
});
