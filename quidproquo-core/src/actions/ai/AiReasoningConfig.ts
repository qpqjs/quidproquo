import { AiReasoningEffort } from './AiReasoningEffort';

/**
 * Enables extended thinking for a prompt at the given effort. Presence turns thinking on. On
 * Claude 4.6 and older the platform turns the effort into a thinking token budget; Opus 4.7 and
 * newer and Sonnet 5 run adaptive thinking and take the effort directly. Reasoning progress is
 * surfaced as Reasoning* stream parts.
 */
export type AiReasoningConfig = {
  effort: AiReasoningEffort;
};
