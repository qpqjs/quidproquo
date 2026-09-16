import { StoryResult } from 'quidproquo-core';

import { LogRedactionResult } from './LogRedactionResult';

/** Pure. Receives a log it may treat as its own copy (the pipeline clones once up front) and must not throw. */
export type LogRedactionParser = (log: StoryResult<any>) => LogRedactionResult;
