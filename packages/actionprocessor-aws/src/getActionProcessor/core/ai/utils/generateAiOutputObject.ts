import { AiJsonSchema, AiStreamUsage } from '@qpqjs/core';

import type { ModelMessage } from 'ai';

import { AiOutputObjectCheck, checkAiOutputObject } from './checkAiOutputObject';

/** One model call's reply, as the repair loop needs it. `output` is undefined when the reply was not JSON. */
export type AiOutputObjectReply = { text: string; output: unknown; usage: AiStreamUsage };

/** Calls the model with this prompt or conversation and returns its parsed reply. */
export type AiOutputObjectGenerate = (promptOrMessages: { prompt: string } | { messages: ModelMessage[] }) => Promise<AiOutputObjectReply>;

/** A reply that fits the schema, or the problems with the last one; with every call's usage. */
export type AiOutputObjectAnswer =
  | { valid: true; text: string; object: unknown; repairs: number; usages: AiStreamUsage[] }
  | { valid: false; problems: string; repairs: number; usages: AiStreamUsage[] };

const toMessages = (promptOrMessages: { prompt: string } | { messages: ModelMessage[] }): ModelMessage[] =>
  'messages' in promptOrMessages ? promptOrMessages.messages : [{ role: 'user', content: promptOrMessages.prompt }];

/**
 * Asks for a reply matching `schema`, and when one does not fit, shows the model its own reply and
 * the exact problems and asks again, up to `maxRepairs` times. Seeing its reply, the model fixes what
 * was named (a misnamed key, a value one level off) instead of regenerating everything and risking a
 * new slip elsewhere.
 */
export const generateAiOutputObject = async (
  generate: AiOutputObjectGenerate,
  initial: { prompt: string } | { messages: ModelMessage[] },
  schema: AiJsonSchema,
  maxRepairs: number,
): Promise<AiOutputObjectAnswer> => {
  const usages: AiStreamUsage[] = [];
  let promptOrMessages = initial;

  for (let repairs = 0; ; repairs += 1) {
    const reply = await generate(promptOrMessages);
    usages.push(reply.usage);

    const check: AiOutputObjectCheck =
      reply.output === undefined ? { valid: false, problems: 'the reply is not JSON' } : checkAiOutputObject(schema, reply.output);
    if (check.valid) {
      return { valid: true, text: reply.text, object: reply.output, repairs, usages };
    }

    if (repairs >= maxRepairs) {
      return { valid: false, problems: check.problems, repairs, usages };
    }

    promptOrMessages = {
      messages: [
        ...toMessages(promptOrMessages),
        { role: 'assistant', content: reply.output === undefined ? reply.text || '(an empty reply)' : JSON.stringify(reply.output) },
        {
          role: 'user',
          content: `That reply does not match the required schema: ${check.problems}. Send the whole reply again with only those problems fixed, changing nothing else.`,
        },
      ],
    };
  }
};
