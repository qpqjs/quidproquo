import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askLogDisableEventHistory } from './askLogDisableEventHistory';
import { LogActionType } from './LogActionType';

describe('askLogDisableEventHistory', () => {
  // Note the polarity: `enable` is whether event history is ENABLED for this
  // correlation. Pass false to disable it (e.g. around sensitive data), true to
  // re-enable it.
  it('yields a DisableEventHistory action with the enable flag and reason', () => {
    const { action } = captureRequester(askLogDisableEventHistory(false, 'handles raw card data'));

    expect(action).toEqual({
      type: LogActionType.DisableEventHistory,
      payload: {
        enable: false,
        reason: 'handles raw card data',
      },
    });
  });

  it('passes the enable flag through unchanged', () => {
    const { action } = captureRequester(askLogDisableEventHistory(true, 'sensitive section finished'));

    expect(action).toEqual({
      type: LogActionType.DisableEventHistory,
      payload: {
        enable: true,
        reason: 'sensitive section finished',
      },
    });
  });

  it('propagates a failure as a thrown error', () => {
    const run = () =>
      runStory(askLogDisableEventHistory(false, 'handles raw card data'), {
        [LogActionType.DisableEventHistory]: throwsError('GenericError', 'logger unavailable'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('logger unavailable');
  });
});
