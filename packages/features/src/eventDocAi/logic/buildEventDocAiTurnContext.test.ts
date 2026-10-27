import { describe, expect, it } from 'vitest';

import { EVENT_DOC_AI_CONTINUATION_NUDGE } from '../constants/eventDocAiContinuationNudge';
import { buildEventDocAiTurnContext } from './buildEventDocAiTurnContext';

describe('buildEventDocAiTurnContext', () => {
  it('sends nothing for a fresh turn with no generated context', () => {
    expect(buildEventDocAiTurnContext('', false)).toEqual([]);
  });

  it('sends the generated context as a user message', () => {
    expect(buildEventDocAiTurnContext('Doc state: v3', false)).toEqual([{ role: 'user', content: 'Doc state: v3' }]);
  });

  it('sends only the nudge when resuming without context', () => {
    expect(buildEventDocAiTurnContext('', true)).toEqual([{ role: 'user', content: EVENT_DOC_AI_CONTINUATION_NUDGE }]);
  });

  it('puts the context before the nudge when resuming', () => {
    expect(buildEventDocAiTurnContext('Doc state: v3', true)).toEqual([
      { role: 'user', content: 'Doc state: v3' },
      { role: 'user', content: EVENT_DOC_AI_CONTINUATION_NUDGE },
    ]);
  });
});
