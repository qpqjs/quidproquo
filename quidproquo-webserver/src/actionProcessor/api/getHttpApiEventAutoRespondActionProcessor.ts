import {
  actionResult,
  askEventAutoRespondBase,
  createActionProcessor,
  EventActionType,
  generateUuid,
  getProcessCustomImplementation,
  MatchStoryResult,
  mergeRuntimeActionProcessors,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { RouteOptions } from '../../config/settings/route';
import { askValidateRouteAuth, ValidateRouteAuthPayload } from '../../stories/askValidateRouteAuth';
import { FileUploadErrorTypeEnum, HTTPEvent, HTTPEventResponse } from '../../types/HTTPEvent';
import { getCorsHeaders } from '../../utils/headerUtils';

type InternalMatchResult = MatchStoryResult<any, RouteOptions>;

const fileUploadErrorHttpStatusMap: Record<FileUploadErrorTypeEnum, number> = {
  [FileUploadErrorTypeEnum.fileTooLarge]: 413,
  [FileUploadErrorTypeEnum.tooManyFiles]: 413,
  [FileUploadErrorTypeEnum.tooManyFields]: 400,
  [FileUploadErrorTypeEnum.disallowedMimeType]: 415,
  [FileUploadErrorTypeEnum.malformed]: 400,
};

const getProcessAutoRespond = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventAutoRespondBase> => {
  const validateAuth = getProcessCustomImplementation<any>(
    qpqConfig,
    askValidateRouteAuth,
    'API Auth Validation',
    null,
    () => new Date().toISOString(),
    generateUuid,
  );

  return async ({ qpqEventRecord: rawEventRecord, matchResult }, session, actionProcessorList, logger, updateSession, dynamicModuleLoader) => {
    // This processor is registered only for the http api event source, so the base's
    // source-agnostic record is an HTTPEvent here.
    const qpqEventRecord = rawEventRecord as HTTPEvent;
    // Just auto respond for options requests
    if (qpqEventRecord.method === 'OPTIONS') {
      return actionResult({
        status: 200,
        isBase64Encoded: false,
        body: '',
        headers: getCorsHeaders(qpqConfig, matchResult.config || {}, qpqEventRecord.headers),
      });
    }

    const authPayload: ValidateRouteAuthPayload = {
      event: qpqEventRecord,
      routeAuthSettings: matchResult.config?.routeAuthSettings,
    };

    // The matched route's processor overrides must be visible HERE, in the
    // framework preamble: auth decode runs before the route story, so without
    // this merge a per-route auth override would never see its own requests.
    const mergedActionProcessorList = await mergeRuntimeActionProcessors(qpqConfig, matchResult.runtime, actionProcessorList, dynamicModuleLoader);

    const [authValid, authError] = await validateAuth(authPayload, session, mergedActionProcessorList, logger, updateSession, dynamicModuleLoader);

    if (authError || !authValid) {
      return actionResult({
        status: 401,
        isBase64Encoded: false,
        body: JSON.stringify({
          message: 'You are unauthorized to access this resource',
        }),
        headers: getCorsHeaders(qpqConfig, matchResult.config || {}, qpqEventRecord.headers),
      });
    }

    // Reject invalid multipart uploads before the route story runs (after auth, so a 401 wins)
    if (qpqEventRecord.fileUploadError) {
      return actionResult({
        status: fileUploadErrorHttpStatusMap[qpqEventRecord.fileUploadError.errorType] || 400,
        isBase64Encoded: false,
        body: JSON.stringify({
          errorType: qpqEventRecord.fileUploadError.errorType,
          errorText: qpqEventRecord.fileUploadError.message,
        }),
        headers: getCorsHeaders(qpqConfig, matchResult.config || {}, qpqEventRecord.headers),
      });
    }

    return actionResult(null);
  };
};

export const getHttpApiEventAutoRespondActionProcessor = createActionProcessor(askEventAutoRespondBase, getProcessAutoRespond);
