import { expectGenerator } from 'quidproquo-testing';

import { describe, expect, it } from 'vitest';

import { runStory, StoryError, throwsError } from '../../testing';
import { askConfigGetSecret } from './askConfigGetSecret';
import { ConfigActionType } from './ConfigActionType';

describe('askConfigGetSecret', () => {
  describe('askConfigGetSecret', () => {
    it('should yield an action with correct type and payload', () => {
      const secretName = 'my-secret-key';

      expectGenerator(askConfigGetSecret(secretName)).toYield({
        type: ConfigActionType.GetSecret,
        payload: { secretName },
      });
    });

    it('should return the value passed to next()', () => {
      const secretName = 'test-secret';
      const mockSecretValue = 'super-secret-value';

      expectGenerator(askConfigGetSecret(secretName))
        .toYield({
          type: ConfigActionType.GetSecret,
          payload: { secretName },
        })
        .whenGiven(mockSecretValue)
        .thenReturn(mockSecretValue);
    });

    it('should handle empty string secret names', () => {
      const mockSecret = 'empty-name-secret';

      expectGenerator(askConfigGetSecret(''))
        .toYield({
          type: ConfigActionType.GetSecret,
          payload: { secretName: '' },
        })
        .whenGiven(mockSecret)
        .thenReturn(mockSecret);
    });

    it('should handle special characters in secret names', () => {
      const secretName = 'my-secret/with.special_chars-123';
      const mockSecretValue = 'special-secret-value';

      expectGenerator(askConfigGetSecret(secretName))
        .toYield({
          type: ConfigActionType.GetSecret,
          payload: { secretName },
        })
        .whenGiven(mockSecretValue)
        .thenReturn(mockSecretValue);
    });

    it('propagates a processor failure as a thrown StoryError', () => {
      const runFailingStory = () =>
        runStory(askConfigGetSecret('missing-secret'), {
          [ConfigActionType.GetSecret]: throwsError(askConfigGetSecret.errorType.ResourceNotFound, 'Secret not found'),
        });

      expect(runFailingStory).toThrow(StoryError);
      expect(runFailingStory).toThrow(`${askConfigGetSecret.errorType.ResourceNotFound}: Secret not found`);
    });
  });

  describe('errorType', () => {
    it('lists every error the processor can produce, namespaced by the action type', () => {
      expect(askConfigGetSecret.errorType).toEqual({
        ResourceNotFound: `${ConfigActionType.GetSecret}-ResourceNotFound`,
        Throttling: `${ConfigActionType.GetSecret}-Throttling`,
      });
    });
  });
});
