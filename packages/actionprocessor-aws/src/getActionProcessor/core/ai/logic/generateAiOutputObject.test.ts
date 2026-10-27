import { describe, expect, it, vi } from 'vitest';

import { AiOutputObjectReply, generateAiOutputObject } from './generateAiOutputObject';

const schema = { type: 'object', properties: { total_interest: { type: 'integer' } }, additionalProperties: false };

const replies = (...outputs: unknown[]) => {
  const generate = vi.fn(async (_input: unknown): Promise<AiOutputObjectReply> => ({ text: '', output: undefined, usage: {} }));
  outputs.forEach((output, index) => generate.mockResolvedValueOnce({ text: `reply ${index}`, output, usage: { outputTokens: index + 1 } }));
  return generate;
};

describe('generateAiOutputObject', () => {
  it('returns a fitting first reply with no repairs and one call', async () => {
    const generate = replies({ total_interest: 5 });

    expect(await generateAiOutputObject(generate, { prompt: 'p' }, schema, 2)).toEqual({
      valid: true,
      text: 'reply 0',
      object: { total_interest: 5 },
      repairs: 0,
      usages: [{ outputTokens: 1 }],
    });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('keeps the whole conversation across repairs, each turn adding the reply and its problems', async () => {
    const generate = replies({ total_interest_amount: 5 }, { total_interest: '5' }, { total_interest: 5 });
    const initial = { messages: [{ role: 'user' as const, content: 'read the file' }] };

    const answer = await generateAiOutputObject(generate, initial, schema, 2);

    expect(answer).toMatchObject({ valid: true, object: { total_interest: 5 }, repairs: 2 });
    const third = generate.mock.calls[2][0] as { messages: { role: string; content: string }[] };
    expect(third.messages.map((message) => message.role)).toEqual(['user', 'assistant', 'user', 'assistant', 'user']);
    expect(third.messages[3].content).toBe('{"total_interest":"5"}');
    expect(third.messages[4].content).toContain('/total_interest must be integer');
  });

  it('gives up after maxRepairs with the last problems and every usage', async () => {
    const generate = replies({ a: 1 }, { b: 2 });

    expect(await generateAiOutputObject(generate, { prompt: 'p' }, schema, 1)).toEqual({
      valid: false,
      problems: '(root) must NOT have additional properties (b)',
      repairs: 1,
      usages: [{ outputTokens: 1 }, { outputTokens: 2 }],
    });
  });

  it('makes no repair call when none are allowed', async () => {
    const generate = replies({ a: 1 });

    expect(await generateAiOutputObject(generate, { prompt: 'p' }, schema, 0)).toMatchObject({ valid: false, repairs: 0 });
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
