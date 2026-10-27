import { expectGenerator } from 'quidproquo-testing';

import { describe, expect, it } from 'vitest';

import { runStory, StoryError, throwsError } from '../../testing';
import { ErrorTypeEnum } from '../../types/ErrorTypeEnum';
import { askConfigGetGlobal } from './askConfigGetGlobal';
import { ConfigActionType } from './ConfigActionType';

describe('askConfigGetGlobal', () => {
  describe('askConfigGetGlobal', () => {
    it('should yield an action with correct type and payload', () => {
      const globalName = 'myGlobalVar';

      expectGenerator(askConfigGetGlobal(globalName)).toYield({
        type: ConfigActionType.GetGlobal,
        payload: { globalName },
      });
    });

    it('should return the value passed to next()', () => {
      const globalName = 'testGlobal';
      const mockGlobalValue = { key: 'value', data: 123 };

      expectGenerator(askConfigGetGlobal(globalName))
        .toYield({
          type: ConfigActionType.GetGlobal,
          payload: { globalName },
        })
        .whenGiven(mockGlobalValue)
        .thenReturn(mockGlobalValue);
    });

    it('should handle typed globals', () => {
      interface MyGlobalType {
        id: number;
        name: string;
        active: boolean;
      }

      const globalName = 'typedGlobal';
      const mockValue: MyGlobalType = { id: 1, name: 'Test', active: true };

      expectGenerator(askConfigGetGlobal<MyGlobalType>(globalName))
        .toYield({
          type: ConfigActionType.GetGlobal,
          payload: { globalName },
        })
        .whenGiven(mockValue)
        .thenReturn(mockValue);
    });

    it('should handle string global values', () => {
      const globalName = 'stringGlobal';
      const mockValue = 'simple string value';

      expectGenerator(askConfigGetGlobal<string>(globalName))
        .toYield({
          type: ConfigActionType.GetGlobal,
          payload: { globalName },
        })
        .whenGiven(mockValue)
        .thenReturn(mockValue);
    });

    it('should handle number global values', () => {
      const globalName = 'numberGlobal';
      const mockValue = 42;

      expectGenerator(askConfigGetGlobal<number>(globalName))
        .toYield({
          type: ConfigActionType.GetGlobal,
          payload: { globalName },
        })
        .whenGiven(mockValue)
        .thenReturn(mockValue);
    });

    it('should handle array global values', () => {
      const globalName = 'arrayGlobal';
      const mockValue = [1, 2, 3, 4, 5];

      expectGenerator(askConfigGetGlobal<number[]>(globalName))
        .toYield({
          type: ConfigActionType.GetGlobal,
          payload: { globalName },
        })
        .whenGiven(mockValue)
        .thenReturn(mockValue);
    });

    it('should handle null and undefined values', () => {
      const globalName = 'nullableGlobal';

      expectGenerator(askConfigGetGlobal(globalName))
        .toYield({
          type: ConfigActionType.GetGlobal,
          payload: { globalName },
        })
        .whenGiven(null)
        .thenReturn(null);

      expectGenerator(askConfigGetGlobal(globalName))
        .toYield({
          type: ConfigActionType.GetGlobal,
          payload: { globalName },
        })
        .whenGiven(undefined)
        .thenReturn(undefined);
    });

    it('should handle global names with special characters', () => {
      const globalName = 'global.name-with_special/chars';
      const mockValue = { special: 'value' };

      expectGenerator(askConfigGetGlobal(globalName))
        .toYield({
          type: ConfigActionType.GetGlobal,
          payload: { globalName },
        })
        .whenGiven(mockValue)
        .thenReturn(mockValue);
    });

    it('propagates a processor failure as a thrown StoryError', () => {
      const runFailingStory = () =>
        runStory(askConfigGetGlobal('missing-global'), {
          [ConfigActionType.GetGlobal]: throwsError(ErrorTypeEnum.NotFound, 'Global not found'),
        });

      expect(runFailingStory).toThrow(StoryError);
      expect(runFailingStory).toThrow(`${ErrorTypeEnum.NotFound}: Global not found`);
    });
  });
});
