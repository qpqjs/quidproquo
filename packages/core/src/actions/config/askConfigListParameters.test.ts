import { expectGenerator } from 'quidproquo-testing';

import { describe, expect, it } from 'vitest';

import { runStory, StoryError, throwsError } from '../../testing';
import { askConfigListParameters } from './askConfigListParameters';
import { ConfigActionType } from './ConfigActionType';

describe('askConfigListParameters', () => {
  describe('askConfigListParameters', () => {
    const standardListParametersAction = { type: ConfigActionType.ListParameters };

    it('should yield an action with correct type and no payload', () => {
      expectGenerator(askConfigListParameters()).toYield(standardListParametersAction);
    });

    it('should return the value passed to next()', () => {
      const mockParameterList = ['param1', 'param2', '/app/config/param3', '/app/db/connection'];

      expectGenerator(askConfigListParameters()).toYield(standardListParametersAction).whenGiven(mockParameterList).thenReturn(mockParameterList);
    });

    it('should handle empty list return', () => {
      const mockEmptyList: string[] = [];

      expectGenerator(askConfigListParameters()).toYield(standardListParametersAction).whenGiven(mockEmptyList).thenReturn(mockEmptyList);
    });

    it('should handle large parameter list return', () => {
      const mockLargeList = Array.from({ length: 100 }, (_, i) => `param-${i}`);

      expectGenerator(askConfigListParameters()).toYield(standardListParametersAction).whenGiven(mockLargeList).thenReturn(mockLargeList);
    });

    it('propagates a processor failure as a thrown StoryError', () => {
      const runFailingStory = () =>
        runStory(askConfigListParameters(), {
          [ConfigActionType.ListParameters]: throwsError(askConfigListParameters.errorType.Throttling, 'Rate exceeded'),
        });

      expect(runFailingStory).toThrow(StoryError);
      expect(runFailingStory).toThrow(`${askConfigListParameters.errorType.Throttling}: Rate exceeded`);
    });
  });

  describe('errorType', () => {
    it('should have Throttling error type', () => {
      expect(askConfigListParameters.errorType.Throttling).toBeDefined();
      expect(askConfigListParameters.errorType.Throttling).toContain('Throttling');
    });

    it('should be prefixed with the action type', () => {
      expect(askConfigListParameters.errorType.Throttling).toContain(ConfigActionType.ListParameters);
    });
  });
});
