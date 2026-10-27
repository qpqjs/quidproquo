import { describe, expect, it, vi } from 'vitest';

import { ConfigActionType } from '../actions/config/ConfigActionType';
import { EventActionType } from '../actions/event/EventActionType';
import { LogActionType } from '../actions/log/LogActionType';
import { SystemActionType } from '../actions/system/SystemActionType';
import { runStory, StoryError, throwsError } from '../testing/storyTesting';
import { askProcessEvent, askProcessEventWithGroupOrdering } from './askProcessEvent';

describe('askProcessEvent', () => {
  it('matches, executes the story for each record and returns the transformed response', () => {
    const result = runStory(askProcessEvent('event-arg'), {
      [ConfigActionType.GetGlobal]: 'v1',
      [EventActionType.GetRecords]: ['record-1'],
      [EventActionType.MatchStory]: { runtime: '/handlers/run::default', runtimeOptions: {} },
      [EventActionType.AutoRespond]: null,
      [EventActionType.GetStorySession]: { correlation: 'corr-1' },
      [SystemActionType.ExecuteStory]: 'story-output',
      [EventActionType.TransformResponseResult]: 'final-response',
    });

    expect(result).toBe('final-response');
  });

  it('uses the auto-respond value and skips story execution for an early exit', () => {
    const execute = vi.fn(() => 'should-not-run');

    const result = runStory(askProcessEvent('event-arg'), {
      [ConfigActionType.GetGlobal]: 'v1',
      [EventActionType.GetRecords]: ['record-1'],
      [EventActionType.MatchStory]: { runtime: '/handlers/run::default', runtimeOptions: {} },
      [EventActionType.AutoRespond]: 'early-response',
      [SystemActionType.ExecuteStory]: execute,
      [EventActionType.TransformResponseResult]: 'final-response',
    });

    expect(result).toBe('final-response');
    expect(execute).not.toHaveBeenCalled();
  });

  it('hands per-record failures to the transform without failing the other records', () => {
    const result = runStory(askProcessEvent('event-arg'), {
      [ConfigActionType.GetGlobal]: 'v1',
      [EventActionType.GetRecords]: [{ id: 'good' }, { id: 'bad' }],
      [EventActionType.MatchStory]: { runtime: '/handlers/run::default', runtimeOptions: {} },
      [EventActionType.AutoRespond]: null,
      [EventActionType.GetStorySession]: { correlation: 'corr-1' },
      [SystemActionType.ExecuteStory]: (action: any) =>
        action.payload.params[0].id === 'bad' ? throwsError('GenericError', 'record exploded') : 'story-output',
      [EventActionType.TransformResponseResult]: (action: any) => action.payload.qpqEventRecordResponses,
    });

    expect(result).toEqual([
      { success: true, result: 'story-output' },
      { success: false, error: { errorType: 'GenericError', errorText: 'record exploded', errorStack: undefined } },
    ]);
  });

  it('returns a match failure for the record instead of crashing the batch', () => {
    const result = runStory(askProcessEvent('event-arg'), {
      [ConfigActionType.GetGlobal]: 'v1',
      [EventActionType.GetRecords]: ['record-1'],
      [EventActionType.MatchStory]: throwsError('NotFound', 'no story matched'),
      [EventActionType.TransformResponseResult]: (action: any) => action.payload.qpqEventRecordResponses,
    });

    expect(result).toEqual([{ success: false, error: { errorType: 'NotFound', errorText: 'no story matched', errorStack: undefined } }]);
  });

  it('logs and throws when the response transform fails', () => {
    const log = vi.fn();

    expect(() =>
      runStory(askProcessEvent('event-arg'), {
        [ConfigActionType.GetGlobal]: 'v1',
        [EventActionType.GetRecords]: ['record-1'],
        [EventActionType.MatchStory]: { runtime: '/handlers/run::default', runtimeOptions: {} },
        [EventActionType.AutoRespond]: null,
        [EventActionType.GetStorySession]: { correlation: 'corr-1' },
        [SystemActionType.ExecuteStory]: 'story-output',
        [EventActionType.TransformResponseResult]: throwsError('Misconfigured', 'bad transform'),
        [LogActionType.Create]: log,
      }),
    ).toThrow(StoryError);

    expect(log).toHaveBeenCalledTimes(1);
  });
});

describe('askProcessEventWithGroupOrdering', () => {
  const getGroupKey = (record: any) => record.groupId;

  // Mocks shared by every test: records execute via ExecuteStory (keyed off the record id),
  // and the transform returns the raw processed record results so tests can assert on them.
  const buildMocks = (records: any[], executeRecord: (recordId: string) => any, executed: string[]) => ({
    [ConfigActionType.GetGlobal]: 'v1',
    [EventActionType.GetRecords]: records,
    [EventActionType.MatchStory]: { runtime: '/handlers/run::default', runtimeOptions: {} },
    [EventActionType.AutoRespond]: null,
    [EventActionType.GetStorySession]: { correlation: 'corr-1' },
    [SystemActionType.ExecuteStory]: (action: any) => {
      const recordId = action.payload.params[0].id;
      executed.push(recordId);
      return executeRecord(recordId);
    },
    [EventActionType.TransformResponseResult]: (action: any) => action.payload.qpqEventRecordResponses,
  });

  it('processes records sequentially in record order', () => {
    const executed: string[] = [];
    const records = [
      { id: '1', groupId: 'A' },
      { id: '2', groupId: 'B' },
      { id: '3', groupId: 'A' },
    ];

    const result = runStory(
      askProcessEventWithGroupOrdering(getGroupKey, 'event-arg'),
      buildMocks(records, () => 'story-output', executed),
    );

    expect(executed).toEqual(['1', '2', '3']);
    expect(result).toEqual([
      { success: true, result: 'story-output' },
      { success: true, result: 'story-output' },
      { success: true, result: 'story-output' },
    ]);
  });

  it('skips later records in a failed group without executing them, leaving other groups untouched', () => {
    const executed: string[] = [];
    const records = [
      { id: '1', groupId: 'A' },
      { id: '2', groupId: 'A' },
      { id: '3', groupId: 'B' },
      { id: '4', groupId: 'A' },
    ];

    const result = runStory(
      askProcessEventWithGroupOrdering(getGroupKey, 'event-arg'),
      buildMocks(records, (recordId) => (recordId === '1' ? throwsError('GenericError', 'boom') : 'story-output'), executed),
    );

    // Records 2 and 4 (group A) never execute; record 3 (group B) is unaffected
    expect(executed).toEqual(['1', '3']);
    expect(result).toEqual([
      { success: false, error: { errorType: 'GenericError', errorText: 'boom', errorStack: undefined } },
      { success: false, error: { errorType: 'GenericError', errorText: 'Skipped: an earlier message in group [A] failed' } },
      { success: true, result: 'story-output' },
      { success: false, error: { errorType: 'GenericError', errorText: 'Skipped: an earlier message in group [A] failed' } },
    ]);
  });

  it('does not couple records with no group key to each other', () => {
    const executed: string[] = [];
    const records = [{ id: '1' }, { id: '2' }, { id: '3' }];

    const result = runStory(
      askProcessEventWithGroupOrdering(getGroupKey, 'event-arg'),
      buildMocks(records, (recordId) => (recordId === '1' ? throwsError('GenericError', 'boom') : 'story-output'), executed),
    );

    // The failure of record 1 doesn't block ungrouped records 2 and 3
    expect(executed).toEqual(['1', '2', '3']);
    expect(result).toEqual([
      { success: false, error: { errorType: 'GenericError', errorText: 'boom', errorStack: undefined } },
      { success: true, result: 'story-output' },
      { success: true, result: 'story-output' },
    ]);
  });
});
