import { expectGenerator } from 'quidproquo-testing';

import { describe, expect, it } from 'vitest';

import { runStory, StoryError, throwsError } from '../../testing';
import { askConfigGetParameters } from './askConfigGetParameters';
import { ConfigActionType } from './ConfigActionType';

describe('askConfigGetParameters', () => {
  describe('askConfigGetParameters', () => {
    it('should yield an action with correct type and payload', () => {
      const parameterNames = ['param1', 'param2', 'param3'];

      expectGenerator(askConfigGetParameters(parameterNames)).toYield({
        type: ConfigActionType.GetParameters,
        payload: { parameterNames },
      });
    });

    it('should return the value passed to next()', () => {
      const parameterNames = ['test-param-1', 'test-param-2'];
      const mockParameterValues = ['value1', 'value2']; // Returns array of strings, not object

      expectGenerator(askConfigGetParameters(parameterNames))
        .toYield({
          type: ConfigActionType.GetParameters,
          payload: { parameterNames },
        })
        .whenGiven(mockParameterValues)
        .thenReturn(mockParameterValues);
    });

    it('should handle empty array', () => {
      const parameterNames: string[] = [];
      const mockValues: string[] = [];

      expectGenerator(askConfigGetParameters(parameterNames))
        .toYield({
          type: ConfigActionType.GetParameters,
          payload: { parameterNames: [] },
        })
        .whenGiven(mockValues)
        .thenReturn(mockValues);
    });

    it('should handle single parameter in array', () => {
      const parameterNames = ['single-param'];
      const mockValues = ['single-value'];

      expectGenerator(askConfigGetParameters(parameterNames))
        .toYield({
          type: ConfigActionType.GetParameters,
          payload: { parameterNames },
        })
        .whenGiven(mockValues)
        .thenReturn(mockValues);
    });

    it('should handle hierarchical parameter names', () => {
      const parameterNames = ['/app/db/host', '/app/db/port', '/app/db/username', '/app/cache/ttl'];
      const mockValues = ['localhost', '5432', 'admin', '3600'];

      expectGenerator(askConfigGetParameters(parameterNames))
        .toYield({
          type: ConfigActionType.GetParameters,
          payload: { parameterNames },
        })
        .whenGiven(mockValues)
        .thenReturn(mockValues);
    });

    it('should handle duplicate parameter names in array', () => {
      const parameterNames = ['param1', 'param2', 'param1'];
      const mockValues = ['value1', 'value2', 'value1'];

      expectGenerator(askConfigGetParameters(parameterNames))
        .toYield({
          type: ConfigActionType.GetParameters,
          payload: { parameterNames },
        })
        .whenGiven(mockValues)
        .thenReturn(mockValues);
    });

    it('propagates a processor failure as a thrown StoryError', () => {
      const runFailingStory = () =>
        runStory(askConfigGetParameters(['p1', 'p2']), {
          [ConfigActionType.GetParameters]: throwsError(askConfigGetParameters.errorType.Throttling, 'Rate exceeded'),
        });

      expect(runFailingStory).toThrow(StoryError);
      expect(runFailingStory).toThrow(`${askConfigGetParameters.errorType.Throttling}: Rate exceeded`);
    });
  });

  describe('errorType', () => {
    it('should have Throttling error type', () => {
      expect(askConfigGetParameters.errorType.Throttling).toBeDefined();
      expect(askConfigGetParameters.errorType.Throttling).toContain('Throttling');
    });

    it('should be prefixed with the action type', () => {
      expect(askConfigGetParameters.errorType.Throttling).toContain(ConfigActionType.GetParameters);
    });
  });
});
