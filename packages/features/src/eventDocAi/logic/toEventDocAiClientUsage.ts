import { type AiStreamUsage, type Nullable, omitKey } from '@qpqjs/core';

/**
 * A reply's usage as the client may see it: its tokens and what it is charged at, never what it
 * cost the platform. No charge when the chat bills nothing.
 */
export const toEventDocAiClientUsage = (usage: AiStreamUsage, chargeMicroUsd: Nullable<number>): AiStreamUsage => ({
  ...omitKey(usage, 'costMicroUsd'),
  ...(chargeMicroUsd === null ? {} : { chargeMicroUsd }),
});
