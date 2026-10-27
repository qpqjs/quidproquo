import { DefineAuthChallengeTriggerEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';

import { getChallengeSessionFromCognitoTriggerEventSession } from './getChallengeSessionFromCognitoTriggerEventSession';

type CognitoSession = DefineAuthChallengeTriggerEvent['request']['session'];

describe('getChallengeSessionFromCognitoTriggerEventSession', () => {
  it('maps challengeMetadata to challengeName and passes the result through', () => {
    const session = [{ challengeName: 'CUSTOM_CHALLENGE', challengeResult: true, challengeMetadata: 'emailCode' }] as unknown as CognitoSession;

    expect(getChallengeSessionFromCognitoTriggerEventSession(session)).toEqual([{ challengeName: 'emailCode', challengeResult: true }]);
  });

  it('defaults challengeName to an empty string when challengeMetadata is missing', () => {
    const session = [{ challengeName: 'CUSTOM_CHALLENGE', challengeResult: false }] as unknown as CognitoSession;

    expect(getChallengeSessionFromCognitoTriggerEventSession(session)).toEqual([{ challengeName: '', challengeResult: false }]);
  });

  it('returns an empty session for an empty input', () => {
    expect(getChallengeSessionFromCognitoTriggerEventSession([] as unknown as CognitoSession)).toEqual([]);
  });
});
