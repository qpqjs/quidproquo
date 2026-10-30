import { EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

describe('s3/fileEvent getEventMatchStoryActionProcessor', () => {
  it('always matches the handler the lambda was stamped with', async () => {
    const processor = await resolveEventProcessor(
      getEventMatchStoryActionProcessor('/entry/drive::onEvent' as QpqFunctionRuntime),
      EventActionType.MatchStory,
    );

    const [match] = await processor({ qpqEventRecord: {} });

    expect((match as any).runtime).toBe('/entry/drive::onEvent' as QpqFunctionRuntime);
  });
});
