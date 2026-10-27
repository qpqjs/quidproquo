import { StoryResult } from 'quidproquo-core';

/** A parser's output: the log with its own redactions applied, plus the values the final sweep must scrub everywhere. */
export type LogRedactionResult = {
  redactedLog: StoryResult<any>;
  redactions: string[];
};
