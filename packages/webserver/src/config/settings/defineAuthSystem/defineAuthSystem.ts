import { defineGlobal, defineServiceSettings, defineUserDirectory, EmailTemplates, QPQConfig, UserDirectoryMfaSettings } from 'quidproquo-core';

import { AUTH_USER_DIRECTORY_GLOBAL_KEY } from '../../../services/auth/config';
import { defineAuthServiceRoute } from '../../../services/auth/config/defineAuthServiceRoute';

export interface AuthSystemOptions {
  phoneRequired?: boolean;

  selfSignUpEnabled?: boolean;

  emailTemplates?: EmailTemplates;

  mfa?: UserDirectoryMfaSettings;

  // Path prefix applied to every auth route, e.g. '/auth' => '/auth/login'.
  basePath?: string;

  allowedOrigins?: string[];

  // Access/ID token (JWT) lifetime in minutes (Cognito 5–1440; omitted → default 60).
  // Shorter shrinks the post-revocation window in which a stateless access token still
  // works. Keep comfortably above 10 (the web client refreshes ~10 min before expiry).
  accessTokenValidityMinutes?: number;
}

// Bundles a complete username/password login flow: a user directory plus the
// endpoints needed to log in, refresh tokens, respond to challenges, recover a
// forgotten password, and change a password. The handler stories ship inside
// quidproquo-webserver (services/auth) and resolve `directoryName` at runtime
// from the global emitted below.
export const defineAuthSystem = (service: string, directoryName: string, options?: AuthSystemOptions): QPQConfig => {
  const basePath = options?.basePath ?? '';

  const routeOptions = {
    allowedOrigins: options?.allowedOrigins,
  };

  return [
    // The user directory is declared at the top level (ungated) so other
    // services in the application can reference it to validate access tokens.
    defineUserDirectory(directoryName, {
      phoneRequired: options?.phoneRequired,
      selfSignUpEnabled: options?.selfSignUpEnabled,
      emailTemplates: options?.emailTemplates,
      mfa: options?.mfa,
      accessTokenValidityMinutes: options?.accessTokenValidityMinutes,
      owner: { module: service },
    }),

    // The login endpoints and their handlers only deploy with the owning service.
    defineServiceSettings({
      [service]: [
        defineGlobal(AUTH_USER_DIRECTORY_GLOBAL_KEY, directoryName),

        defineAuthServiceRoute('POST', `${basePath}/login`, 'login', routeOptions),
        defineAuthServiceRoute('POST', `${basePath}/refreshToken`, 'refreshToken', routeOptions),
        // Public + best-effort (logout must never fail for the client, so it isn't
        // edge-gated). /logout revokes just the caller's own refresh token (this device);
        // /logoutEverywhere revokes all of the user's sessions (settings "sign out of all
        // devices"). Each is self-authorizing: the refresh token / access token it carries.
        defineAuthServiceRoute('POST', `${basePath}/logout`, 'logout', routeOptions),
        defineAuthServiceRoute('POST', `${basePath}/logoutEverywhere`, 'logoutEverywhere', routeOptions),
        defineAuthServiceRoute('POST', `${basePath}/challenge`, 'respondToAuthChallenge', routeOptions),
        defineAuthServiceRoute('POST', `${basePath}/associateSoftwareToken`, 'associateSoftwareToken', routeOptions),
        defineAuthServiceRoute('POST', `${basePath}/forgotPassword`, 'forgotPassword', routeOptions),
        defineAuthServiceRoute('POST', `${basePath}/forgotPassword/confirm`, 'confirmForgotPassword', routeOptions),

        // Authenticated: the caller must present a valid access token.
        defineAuthServiceRoute('POST', `${basePath}/changePassword`, 'changePassword', {
          ...routeOptions,
          routeAuthSettings: {
            userDirectoryName: directoryName,
          },
        }),
      ],
    }),
  ];
};
