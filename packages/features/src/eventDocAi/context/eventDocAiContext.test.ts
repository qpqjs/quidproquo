import { ContextActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askEventDocAiProvide } from './askEventDocAiProvide';
import { askEventDocAiRead } from './askEventDocAiRead';
import { eventDocAiContext } from './eventDocAiContext';

describe('eventDocAiContext', () => {
  it('defaults to an empty document under the qpq key', () => {
    expect(eventDocAiContext.uniqueName).toBe('qpq-event-doc-ai');
    expect(eventDocAiContext.defaultValue).toEqual({ serviceName: '', type: '', docId: '' });
  });

  it('round-trips a provided document to the reader', () => {
    const context = { serviceName: 'svc', type: 'plan', docId: 'doc-1' };

    expect(runStory(askEventDocAiProvide(context, askEventDocAiRead()))).toEqual(context);
    expect(runStory(askEventDocAiRead(), { [ContextActionType.Read]: context })).toEqual(context);
  });
});
