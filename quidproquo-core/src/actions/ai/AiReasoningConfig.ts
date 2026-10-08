import { AiReasoningEffort } from './AiReasoningEffort';

/**
 * Enables extended thinking for a prompt. Presence turns thinking on. Which field applies
 * depends on the model: Claude 4.6 and older take a token budget and ignore `effort`; Opus 4.7
 * and newer and Sonnet 5 run adaptive thinking, take `effort` and ignore `budgetTokens`.
 * Reasoning progress is surfaced as Reasoning* stream parts.
 */
export type AiReasoningConfig = {
  budgetTokens?: number;
  effort?: AiReasoningEffort;
};
