import {
  ActionProcessorList,
  ActionProcessorListResolver,
  actionResult,
  askRouteAuthValidationDecode,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
  qpqWebServerUtils,
  RouteAuthDecodeOutcome,
  RouteAuthDecodeResult,
  RouteAuthValidationActionType,
} from 'quidproquo';

import { verifyGithubOidcToken } from '../../logic/github/verifyGithubOidcToken';

// Route auth decode override for the smoke routes: the bearer must be a GitHub
// Actions OIDC token pinned to our repo and this deployment's environment.
// There is deliberately no notApplicable outcome here: a request either proves
// it is our workflow or it is 401, including requests with no token at all.
const getProcessGithubOidcDecode = (
  qpqConfig: QPQConfig
): ProcessorFor<typeof askRouteAuthValidationDecode> => {
  const expectedEnvironment =
    qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);

  return async ({ event }) => {
    const authHeader = qpqWebServerUtils.getHeaderValue(
      'Authorization',
      event.headers
    );
    const [authType, accessToken] = (authHeader || '').split(' ');

    if (authType !== 'Bearer' || !accessToken) {
      return actionResult<RouteAuthDecodeResult>({
        outcome: RouteAuthDecodeOutcome.invalid,
      });
    }

    const claims = await verifyGithubOidcToken(
      accessToken,
      expectedEnvironment
    );
    if (!claims) {
      return actionResult<RouteAuthDecodeResult>({
        outcome: RouteAuthDecodeOutcome.invalid,
      });
    }

    return actionResult<RouteAuthDecodeResult>({
      outcome: RouteAuthDecodeOutcome.valid,
      decodedAccessToken: {
        userId: claims.sub,
        username: `${claims.repository}#${claims.run_id}`,
        exp: claims.exp,
        userDirectory: 'github-oidc',
        wasValid: true,
      },
    });
  };
};

export const getGithubOidcAuthProcessors: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig
): Promise<ActionProcessorList> => ({
  [RouteAuthValidationActionType.Decode]: getProcessGithubOidcDecode(qpqConfig),
});
