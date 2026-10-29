import { actionResult, actionResultError, createStreamRegistry, ErrorTypeEnum, EventActionType } from '@qpqjs/core';
import { buildActionProcessorList, buildTestQpqConfig, buildTestStorySession, createStubLogger, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { RouteAuthDecodeOutcome, RouteAuthValidationActionType } from '../../actions/routeAuthValidation';
import { RouteOptions } from '../../config/settings/route';
import { HTTPEvent } from '../../types/HTTPEvent';
import { getHttpApiEventGetStorySessionActionProcessor } from './getHttpApiEventGetStorySessionActionProcessor';

const qpqConfig = buildTestQpqConfig();

const notApplicableDecode = { [RouteAuthValidationActionType.Decode]: async () => actionResult({ outcome: RouteAuthDecodeOutcome.notApplicable }) };

const invoke = async (
  qpqEventRecord: Partial<HTTPEvent>,
  config: RouteOptions,
  processors: Record<string, any> = {},
  matchResultExtras: Record<string, any> = {},
  dynamicModuleLoader: any = noopDynamicModuleLoader,
) => {
  const map = await getHttpApiEventGetStorySessionActionProcessor(qpqConfig, dynamicModuleLoader);
  const processor = map[EventActionType.GetStorySession];

  return processor(
    { qpqEventRecord, matchStoryResult: { config, ...matchResultExtras } },
    buildTestStorySession(),
    buildActionProcessorList({ [RouteAuthValidationActionType.ResolveContext]: async () => actionResult({}), ...processors }),
    createStubLogger(),
    () => {},
    dynamicModuleLoader,
    createStreamRegistry(),
  );
};

describe('getHttpApiEventGetStorySessionActionProcessor', () => {
  it('returns an undefined session when there is no access token', async () => {
    const [session] = await invoke({ headers: {} }, {}, notApplicableDecode);

    expect(session).toBeUndefined();
  });

  it('attaches the validated token to the session for an authenticated route', async () => {
    const decoded = { wasValid: true, userId: 'u1' };
    const [session] = await invoke(
      { headers: { authorization: 'Bearer token' } },
      { routeAuthSettings: { userDirectoryName: 'users' } },
      { [RouteAuthValidationActionType.Decode]: async () => actionResult({ outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: decoded }) },
    );

    expect(session.decodedAccessToken).toEqual(decoded);
  });

  it('fails the request when the session story errors, rather than running it with no identity', async () => {
    const [session, error] = await invoke(
      { headers: { authorization: 'Bearer token' } },
      { routeAuthSettings: { userDirectoryName: 'users' } },
      { [RouteAuthValidationActionType.Decode]: async () => actionResultError(ErrorTypeEnum.GenericError, 'decode blew up') },
    );

    expect(session).toBeUndefined();
    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
  });

  it('fails the request when the context resolver rejects', async () => {
    const decoded = { wasValid: true, userId: 'u1' };
    const [session, error] = await invoke(
      { headers: { authorization: 'Bearer token' } },
      { routeAuthSettings: { userDirectoryName: 'users' } },
      {
        [RouteAuthValidationActionType.Decode]: async () => actionResult({ outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: decoded }),
        [RouteAuthValidationActionType.ResolveContext]: async () => actionResultError(ErrorTypeEnum.Forbidden, 'Not a member of this tenant'),
      },
    );

    expect(session).toBeUndefined();
    expect(error).toEqual(expect.objectContaining({ errorType: ErrorTypeEnum.Forbidden, errorText: 'Not a member of this tenant' }));
  });

  it('seeds context from the matched runtime context override', async () => {
    const decoded = { wasValid: true, userId: 'u1' };
    const resolveTenant = async () => actionResult({ storageScope: 'TENANT#t1' });
    const loadOverrideSource = async () => async () => ({ [RouteAuthValidationActionType.ResolveContext]: resolveTenant });

    const [session] = await invoke(
      { headers: { authorization: 'Bearer token' } },
      { routeAuthSettings: { userDirectoryName: 'users' } },
      { [RouteAuthValidationActionType.Decode]: async () => actionResult({ outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: decoded }) },
      {
        runtime: {
          basePath: '/svc/src',
          relativePath: '/mcp::mcpPost',
          functionName: 'mcpPost',
          actionProcessors: [{ basePath: '/svc/src', relativePath: '/auth/impl::getOverrides', functionName: 'getOverrides' }],
        },
      },
      loadOverrideSource,
    );

    expect(session.decodedAccessToken).toEqual(decoded);
    expect(session.context).toEqual(expect.objectContaining({ storageScope: 'TENANT#t1' }));
  });

  it('marks an unverified token as wasValid false on an unauthenticated route', async () => {
    // A JWT-shaped token whose payload decodes without any signature check
    const payload = Buffer.from(JSON.stringify({ sub: 'forged-user', exp: 123 }), 'utf-8').toString('base64url');
    const token = `header.${payload}.signature`;

    const [session] = await invoke({ headers: { authorization: `Bearer ${token}` } }, {}, notApplicableDecode);

    expect(session.decodedAccessToken.userId).toBe('forged-user');
    expect(session.decodedAccessToken.wasValid).toBe(false);
  });

  it('seeds a custom validator identity via the matched runtime decode override', async () => {
    // The route has no user directory; only the runtime-attached override knows
    // how to produce an identity, and that identity must reach the session.
    const decoded = { wasValid: true, userId: 'github-actions' };
    const decodeWithIdentity = async () => actionResult({ outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: decoded });
    const loadOverrideSource = async () => async () => ({ [RouteAuthValidationActionType.Decode]: decodeWithIdentity });

    const [session] = await invoke(
      { headers: { authorization: 'Bearer oidc-token' } },
      { routeAuthSettings: {} },
      notApplicableDecode,
      {
        runtime: {
          basePath: '/svc/src',
          relativePath: '/auth::getOverrides',
          functionName: 'getOverrides',
          actionProcessors: [{ basePath: '/svc/src', relativePath: '/auth/impl::getOverrides', functionName: 'getOverrides' }],
        },
      },
      loadOverrideSource,
    );

    expect(session.decodedAccessToken).toEqual(decoded);
  });
});
