import { StoryResult } from 'quidproquo-core';

import { logRedactionParsers } from './parsers/logRedactionParsers';
import { LogRedactionResult } from './types/LogRedactionResult';
import { sweepRedactions } from './sweepRedactions';

/**
 * The single transform every admin-visible copy of a log passes through, whether written to the
 * reports drive cache or indexed in memory. Runs every parser in turn, then sweeps every reported
 * value out of every string in the log. Never mutates its input.
 */
export const redactStoryResult = (storyResult: StoryResult<any>): StoryResult<any> => {
  const initial: LogRedactionResult = { redactedLog: structuredClone(storyResult), redactions: [] };

  const parsed = logRedactionParsers.reduce<LogRedactionResult>((acc, parser) => {
    const result = parser(acc.redactedLog);
    return { redactedLog: result.redactedLog, redactions: [...acc.redactions, ...result.redactions] };
  }, initial);

  return sweepRedactions(parsed.redactedLog, parsed.redactions);
};
