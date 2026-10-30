import { askDateNow, AskResponse, QpqRuntimeType } from '@qpqjs/core';

import { LogMetadata } from '../../entry/domain';

export function* askErrorReadingStoryResultToMetadata(correlation: string): AskResponse<LogMetadata> {
  const errorText = 'Error loading story result';
  const tags = [errorText];

  // Base metadata
  const metadata: LogMetadata = {
    correlation: correlation,
    moduleName: correlation.split('::')[0] ?? '',
    runtimeType: QpqRuntimeType.EXECUTE_STORY,
    startedAt: yield* askDateNow(),
    generic: tags.filter((t) => !!t).join(', '),
    executionTimeMs: 0,

    error: errorText,
  };

  return metadata;
}
