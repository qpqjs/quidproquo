import { QpqRuntimeType, StoryResult } from '@qpqjs/core';

import { redactStoryResult } from '../../admin/log/logic/redaction/redactStoryResult';
import { UNREDACTABLE_LOG_VALUE } from '../constants/UNREDACTABLE_LOG_VALUE';

/**
 * Runs the admin log redaction over one value by wrapping it as the input of an otherwise
 * empty story result. Only the parsers that read the value itself apply (known keys, key
 * fragments, basic auth, JWTs, url fragments); values marked earlier in the story with
 * askRedactString are not known here. A value that cannot be cloned is replaced whole.
 */
export const redactLogValue = (value: unknown): unknown => {
  const wrapper: StoryResult<[unknown]> = {
    input: [value],
    session: { depth: 0, context: {} },
    history: [],
    startedAt: '',
    finishedAt: '',
    correlation: '',
    tags: [],
    moduleName: '',
    runtimeType: QpqRuntimeType.UNIT_TEST,
  };

  try {
    return redactStoryResult(wrapper).input[0];
  } catch {
    return UNREDACTABLE_LOG_VALUE;
  }
};
