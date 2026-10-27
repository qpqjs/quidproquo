import { AiMessage } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { AiDriveFileResolver, toSdkMessages } from './toSdkMessages';

const failingResolver: AiDriveFileResolver = () => {
  throw new Error('resolver should not be called');
};

describe('toSdkMessages', () => {
  it('passes a string user message through', async () => {
    expect(await toSdkMessages([{ role: 'user', content: 'hello' }] as AiMessage[], failingResolver)).toEqual([{ role: 'user', content: 'hello' }]);
  });

  it('maps user text and file parts', async () => {
    const [message] = await toSdkMessages(
      [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'look' },
            { type: 'file', url: 'https://x/y.png', mediaType: 'image/png', filename: 'y.png' },
          ],
        },
      ] as AiMessage[],
      failingResolver,
    );

    expect(message.role).toBe('user');
    const content = message.content as Array<Record<string, unknown>>;
    expect(content[0]).toEqual({ type: 'text', text: 'look' });
    expect(content[1].type).toBe('file');
    expect(content[1].mediaType).toBe('image/png');
    expect((content[1].data as URL).href).toBe('https://x/y.png');
  });

  it('resolves drive file parts through the resolver', async () => {
    const resolver = vi.fn(async () => ({ base64Data: 'AAECAw==', filename: 'stored.pdf' }));

    const [message] = await toSdkMessages(
      [
        {
          role: 'user',
          content: [{ type: 'file', drive: 'chat-drive', filepath: 'doc-1/assets/a1', mediaType: 'application/pdf' }],
        },
      ] as AiMessage[],
      resolver,
    );

    expect(resolver).toHaveBeenCalledWith('chat-drive', 'doc-1/assets/a1', undefined);
    const content = message.content as Array<Record<string, unknown>>;
    expect(content[0]).toEqual({ type: 'file', data: 'AAECAw==', mediaType: 'application/pdf', filename: 'stored.pdf' });
  });

  it('forwards the tenant scope of a drive file part to the resolver', async () => {
    const resolver = vi.fn(async () => ({ base64Data: 'AAECAw==', filename: 'stored.pdf' }));

    await toSdkMessages(
      [
        {
          role: 'user',
          content: [{ type: 'file', drive: 'chat-drive', filepath: 'doc-1/assets/a1', scope: 'tenant-a', mediaType: 'application/pdf' }],
        },
      ] as AiMessage[],
      resolver,
    );

    expect(resolver).toHaveBeenCalledWith('chat-drive', 'doc-1/assets/a1', 'tenant-a');
  });

  it('prefers the part filename over the stored filename for drive parts', async () => {
    const resolver = vi.fn(async () => ({ base64Data: 'AAECAw==', filename: 'stored.pdf' }));

    const [message] = await toSdkMessages(
      [
        {
          role: 'user',
          content: [{ type: 'file', drive: 'chat-drive', filepath: 'doc-1/assets/a1', mediaType: 'application/pdf', filename: 'quote.pdf' }],
        },
      ] as AiMessage[],
      resolver,
    );

    const content = message.content as Array<Record<string, unknown>>;
    expect(content[0].filename).toBe('quote.pdf');
  });

  it('passes a string assistant message through', async () => {
    expect(await toSdkMessages([{ role: 'assistant', content: 'hi there' }] as AiMessage[], failingResolver)).toEqual([
      { role: 'assistant', content: 'hi there' },
    ]);
  });

  it('maps assistant text, file, tool-call and reasoning parts', async () => {
    const [message] = await toSdkMessages(
      [
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'sure' },
            { type: 'file', url: 'https://x/a.pdf', mediaType: 'application/pdf', filename: 'a.pdf' },
            { type: 'tool-call', toolCallId: 'c1', toolName: 'calc', input: { a: 1 } },
            { type: 'reasoning', text: 'because', providerOptions: { foo: 'bar' } },
          ],
        },
      ] as AiMessage[],
      failingResolver,
    );

    const content = message.content as Array<Record<string, unknown>>;
    expect(content[0]).toEqual({ type: 'text', text: 'sure' });
    expect(content[1].type).toBe('file');
    expect((content[1].data as URL).href).toBe('https://x/a.pdf');
    expect(content[2]).toEqual({ type: 'tool-call', toolCallId: 'c1', toolName: 'calc', input: { a: 1 } });
    expect(content[3]).toEqual({ type: 'reasoning', text: 'because', providerOptions: { foo: 'bar' } });
  });

  it.each([
    ['string success', 'ok', false, { type: 'text', value: 'ok' }],
    ['json success', { n: 1 }, false, { type: 'json', value: { n: 1 } }],
    ['string error', 'fail', true, { type: 'error-text', value: 'fail' }],
    ['json error', { code: 9 }, true, { type: 'error-json', value: { code: 9 } }],
  ])('maps a tool result with %s output', async (_label: string, output: unknown, isError: boolean, expectedOutput: unknown) => {
    const [message] = await toSdkMessages(
      [{ role: 'tool', content: [{ type: 'tool-result', toolCallId: 'c1', toolName: 'calc', output, isError }] }] as AiMessage[],
      failingResolver,
    );

    expect(message.role).toBe('tool');
    expect((message.content as Array<Record<string, unknown>>)[0]).toEqual({
      type: 'tool-result',
      toolCallId: 'c1',
      toolName: 'calc',
      output: expectedOutput,
    });
  });
});
