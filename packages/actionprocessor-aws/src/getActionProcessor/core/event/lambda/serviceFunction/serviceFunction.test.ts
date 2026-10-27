import { buildTestQpqConfig, ErrorTypeEnum, EventActionType } from 'quidproquo-core';
import { QPQWebServerConfigSettingType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { resolveEventProcessor } from '../../../../../testing/eventProcessorTestHelpers';
import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

describe('lambda/serviceFunction getEventGetRecordsActionProcessor', () => {
  it('maps the function name and payload to an internal record', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = { functionName: 'doThing', payload: [1, 2] };

    const [records] = await processor({ eventParams: [event, {}] });

    expect(records).toEqual([{ functionName: 'doThing', payload: [1, 2] }]);
  });
});

describe('lambda/serviceFunction getEventMatchStoryActionProcessor', () => {
  it('returns a NotFound error when no service function matches', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory);

    const [, error] = await processor({ qpqEventRecord: { functionName: 'missing' } });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns the runtime for a matching service function', async () => {
    const runtime = { src: 'doThing' };
    const config = buildTestQpqConfig([
      { configSettingType: QPQWebServerConfigSettingType.ServiceFunction, functionName: 'doThing', runtime } as any,
    ]);
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, config);

    const [match] = await processor({ qpqEventRecord: { functionName: 'doThing' } });

    expect((match as any).runtime).toEqual(runtime);
  });
});

describe('lambda/serviceFunction getEventTransformResponseResultActionProcessor', () => {
  it('returns the record straight back to the caller', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: true, result: 'value' };

    expect(await processor({ eventParams: [{}], qpqEventRecordResponses: [record] })).toEqual([record]);
  });
});

describe('lambda/serviceFunction auto respond and story session', () => {
  it('auto responds with null', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({ qpqEventRecord: {}, matchResult: {} })).toEqual([null]);
  });

  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    expect(await processor({ qpqEventRecord: {}, eventParams: [] })).toEqual([undefined]);
  });
});
