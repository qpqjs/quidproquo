import { expectGenerator } from 'quidproquo-testing';

import { describe, expect, it } from 'vitest';

import { runStory, StoryError, throwsError } from '../../testing';
import { askConfigGetParameter } from './askConfigGetParameter';
import { ConfigActionType } from './ConfigActionType';

describe('askConfigGetParameter', () => {
  describe('askConfigGetParameter', () => {
    it('should yield an action with correct type and payload', () => {
      const parameterName = 'my-parameter';

      expectGenerator(askConfigGetParameter(parameterName)).toYield({
        type: ConfigActionType.GetParameter,
        payload: { parameterName },
      });
    });

    it('should return the value passed to next()', () => {
      const parameterName = 'test-param';
      const mockParameterValue = 'parameter-value';

      expectGenerator(askConfigGetParameter(parameterName))
        .toYield({
          type: ConfigActionType.GetParameter,
          payload: { parameterName },
        })
        .whenGiven(mockParameterValue)
        .thenReturn(mockParameterValue);
    });

    it('should handle hierarchical parameter names', () => {
      const parameterName = '/app/db/connection-string';
      const mockValue = 'mongodb://localhost:27017';

      expectGenerator(askConfigGetParameter(parameterName))
        .toYield({
          type: ConfigActionType.GetParameter,
          payload: { parameterName },
        })
        .whenGiven(mockValue)
        .thenReturn(mockValue);
    });

    it('should handle parameter names with special characters', () => {
      const parameterName = 'config.param-name_123';
      const mockValue = 'special-value';

      expectGenerator(askConfigGetParameter(parameterName))
        .toYield({
          type: ConfigActionType.GetParameter,
          payload: { parameterName },
        })
        .whenGiven(mockValue)
        .thenReturn(mockValue);
    });

    it('propagates a processor failure as a thrown StoryError', () => {
      const runFailingStory = () =>
        runStory(askConfigGetParameter('some-param'), {
          [ConfigActionType.GetParameter]: throwsError(askConfigGetParameter.errorType.Throttling, 'Rate exceeded'),
        });

      expect(runFailingStory).toThrow(StoryError);
      expect(runFailingStory).toThrow(`${askConfigGetParameter.errorType.Throttling}: Rate exceeded`);
    });
  });

  describe('errorType', () => {
    it('should have Throttling error type', () => {
      expect(askConfigGetParameter.errorType.Throttling).toBeDefined();
      expect(askConfigGetParameter.errorType.Throttling).toContain('Throttling');
    });

    it('should be prefixed with the action type', () => {
      expect(askConfigGetParameter.errorType.Throttling).toContain(ConfigActionType.GetParameter);
    });
  });
});
