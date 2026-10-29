import { describe, expect, it, vi } from 'vitest';

import { buildAiPromptInput } from './buildAiPromptInput';

const resolveDriveFile = vi.fn();

describe('buildAiPromptInput', () => {
  it('sends a bare prompt as a prompt', async () => {
    expect(await buildAiPromptInput({ prompt: 'hi' }, resolveDriveFile)).toEqual({ promptOrMessages: { prompt: 'hi' }, durableCount: 0 });
  });

  it('treats an empty turn context like none at all', async () => {
    expect(await buildAiPromptInput({ prompt: 'hi', turnContext: [] }, resolveDriveFile)).toEqual({
      promptOrMessages: { prompt: 'hi' },
      durableCount: 0,
    });
  });

  it('maps the conversation to sdk messages', async () => {
    const input = await buildAiPromptInput({ prompt: 'ignored', messages: [{ role: 'user', content: 'hi' }] }, resolveDriveFile);

    expect(input).toEqual({ promptOrMessages: { messages: [{ role: 'user', content: 'hi' }] }, durableCount: 1 });
  });

  it('appends the turn context after the conversation and counts only the conversation as durable', async () => {
    const input = await buildAiPromptInput(
      {
        prompt: 'ignored',
        messages: [
          { role: 'user', content: 'q1' },
          { role: 'assistant', content: 'a1' },
        ],
        turnContext: [{ role: 'user', content: 'current state' }],
      },
      resolveDriveFile,
    );

    expect(input).toEqual({
      promptOrMessages: {
        messages: [
          { role: 'user', content: 'q1' },
          { role: 'assistant', content: 'a1' },
          { role: 'user', content: 'current state' },
        ],
      },
      durableCount: 2,
    });
  });

  it('turns a prompt into the single saved user message when a turn context needs the messages form', async () => {
    const input = await buildAiPromptInput({ prompt: 'summarise', turnContext: [{ role: 'user', content: 'current state' }] }, resolveDriveFile);

    expect(input).toEqual({
      promptOrMessages: {
        messages: [
          { role: 'user', content: 'summarise' },
          { role: 'user', content: 'current state' },
        ],
      },
      durableCount: 1,
    });
    expect(input.promptOrMessages).not.toHaveProperty('prompt');
  });
});
