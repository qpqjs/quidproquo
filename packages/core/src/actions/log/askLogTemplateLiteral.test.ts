import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askLogTemplateLiteral } from './askLogTemplateLiteral';
import { LogActionType } from './LogActionType';

describe('askLogTemplateLiteral', () => {
  it('yields a TemplateLiteral action splitting strings and variables into messageParts', () => {
    const { action } = captureRequester(askLogTemplateLiteral`user ${'alice'} did ${'login'}`);

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
    const { action } = captureRequester(askLogTemplateLiteral`static message`);

    expect(action).toEqual({
      type: LogActionType.TemplateLiteral,
      payload: {
        messageParts: [['static message'], []],
      },
    });
  });

  it('propagates a logging failure as a thrown error', () => {
    const run = () =>
      runStory(askLogTemplateLiteral`boom`, {
        [LogActionType.TemplateLiteral]: throwsError('GenericError', 'log sink unavailable'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('log sink unavailable');
  });
});
