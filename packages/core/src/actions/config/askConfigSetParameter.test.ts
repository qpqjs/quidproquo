import { expectGenerator } from 'quidproquo-testing';

import { describe, expect, it } from 'vitest';

import { runStory, StoryError, throwsError } from '../../testing';
import { askConfigSetParameter } from './askConfigSetParameter';
import { ConfigActionType } from './ConfigActionType';

describe('askConfigSetParameter', () => {
  describe('askConfigSetParameter', () => {
    it('should yield an action with correct type and payload', () => {
      const parameterName = 'my-parameter';
      const parameterValue = 'my-value';

      expectGenerator(askConfigSetParameter(parameterName, parameterValue)).toYield({
        type: ConfigActionType.SetParameter,
        payload: { parameterName, parameterValue },
      });
    });

    it('should return void when complete', () => {
      const parameterName = 'test-param';
      const parameterValue = 'test-value';

      expectGenerator(askConfigSetParameter(parameterName, parameterValue))
        .toYield({
          type: ConfigActionType.SetParameter,
          payload: { parameterName, parameterValue },
        })
        .thenComplete();
    });

    it('should handle empty string values', () => {
      const parameterName = 'empty-param';
      const parameterValue = '';

      expectGenerator(askConfigSetParameter(parameterName, parameterValue))
        .toYield({
          type: ConfigActionType.SetParameter,
          payload: { parameterName, parameterValue: '' },
        })
        .thenComplete();
    });

    it('should handle complex JSON string values', () => {
      const parameterName = 'json-config';
      const parameterValue = JSON.stringify({ key: 'value', nested: { data: 123 } });

      expectGenerator(askConfigSetParameter(parameterName, parameterValue))
        .toYield({
          type: ConfigActionType.SetParameter,
          payload: { parameterName, parameterValue },
        })
        .thenComplete();
    });

    it('should handle hierarchical parameter names', () => {
      const parameterName = '/app/config/database/connection';
      const parameterValue = 'postgres://localhost:5432/mydb';

      expectGenerator(askConfigSetParameter(parameterName, parameterValue))
        .toYield({
          type: ConfigActionType.SetParameter,
          payload: { parameterName, parameterValue },
        })
        .thenComplete();
    });

    it('should handle multiline string values', () => {
      const parameterName = 'multiline-config';
      const parameterValue = `line1
line2
line3`;

      expectGenerator(askConfigSetParameter(parameterName, parameterValue))
        .toYield({
          type: ConfigActionType.SetParameter,
          payload: { parameterName, parameterValue },
        })
        .thenComplete();
    });

    it('propagates a processor failure as a thrown StoryError', () => {
      const runFailingStory = () =>
        runStory(askConfigSetParameter('some-param', 'some-value'), {
          [ConfigActionType.SetParameter]: throwsError(askConfigSetParameter.errorType.QuotaExceeded, 'Parameter store limit hit'),
        });

      expect(runFailingStory).toThrow(StoryError);
      expect(runFailingStory).toThrow(`${askConfigSetParameter.errorType.QuotaExceeded}: Parameter store limit hit`);
    });
  });

  describe('errorType', () => {
    it('lists every error the processor can produce, namespaced by the action type', () => {
      expect(askConfigSetParameter.errorType).toEqual({
        Throttling: `${ConfigActionType.SetParameter}-Throttling`,
        QuotaExceeded: `${ConfigActionType.SetParameter}-QuotaExceeded`,
      });
    });
  });
});
