import { AuthenticateUserChallenge } from 'quidproquo-core';
import { authContext, QpqRuntimeEffectCatcher, useQpqRuntime } from 'quidproquo-web-react';

import { ReactNode } from 'react';

import { AuthChallengeMfaSetup } from './AuthChallengeMfaSetup/AuthChallengeMfaSetup';
import { AuthChallengeNewPasswordRequired } from './AuthChallengeNewPasswordRequired/AuthChallengeNewPasswordRequired';
import { AuthChallengeSoftwareTokenMfa } from './AuthChallengeSoftwareTokenMfa/AuthChallengeSoftwareTokenMfa';
import { isLoggedOn } from './logic/isLoggedOn';
import { authRuntime } from './logic';
import { Login } from './Login';

interface AuthProps {
  children?: ReactNode;
}

export function Auth({ children }: AuthProps) {
  const [api, state] = useQpqRuntime(authRuntime);

  const isAuthenticated = isLoggedOn(state);

  if (state.authenticateUserResponse?.challenge === AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED) {
    return (
      <QpqRuntimeEffectCatcher runtime={authRuntime}>
        <AuthChallengeNewPasswordRequired authState={state}></AuthChallengeNewPasswordRequired>
      </QpqRuntimeEffectCatcher>
    );
  }

  if (state.authenticateUserResponse?.challenge === AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA) {
    return (
      <QpqRuntimeEffectCatcher runtime={authRuntime}>
        <AuthChallengeSoftwareTokenMfa authState={state}></AuthChallengeSoftwareTokenMfa>
      </QpqRuntimeEffectCatcher>
    );
  }

  if (state.authenticateUserResponse?.challenge === AuthenticateUserChallenge.MFA_SETUP) {
    return (
      <QpqRuntimeEffectCatcher runtime={authRuntime}>
        <AuthChallengeMfaSetup authState={state}></AuthChallengeMfaSetup>
      </QpqRuntimeEffectCatcher>
    );
  }

  return (
    <QpqRuntimeEffectCatcher runtime={authRuntime}>
      {!isAuthenticated && (
        <Login
          onLogin={api.authLogin}
          password={state.password}
          setPassword={api.authUISetPassword}
          setUsername={api.authUISetUsername}
          username={state.username}
        />
      )}
      {isAuthenticated && (
        <authContext.Provider
          value={{
            challenge: state.authenticateUserResponse?.challenge,
            session: state.authenticateUserResponse?.session,
            username: state.username,
            authenticationInfo: state.authenticateUserResponse?.authenticationInfo,
          }}
        >
          {children}
        </authContext.Provider>
      )}
    </QpqRuntimeEffectCatcher>
  );
}
