import { EitherActionResult } from 'quidproquo-core';

import { McpToolCallResult } from '../models/McpToolCallResult';

/** A tool's outcome as a `tools/call` result: the return value as JSON text, or the error as text with `isError`. */
export const buildMcpToolCallResult = (outcome: EitherActionResult<unknown>): McpToolCallResult =>
  outcome.success
    ? { content: [{ type: 'text', text: JSON.stringify(outcome.result ?? null) }] }
    : { content: [{ type: 'text', text: `${outcome.error.errorType}: ${outcome.error.errorText}` }], isError: true };
