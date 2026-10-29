import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  ActionProcessorList,
  ActionProcessorResult,
  actionResult,
  actionResultError,
  askFileGenerateTemporarySecureUrl,
  createNestedRuntime,
  DynamicModuleLoader,
  getDateNow,
  QPQConfig,
  qpqCoreUtils,
  QpqLogger,
  QpqRuntimeType,
  StorySession,
  StreamRegistry,
  toCrossServiceSession,
  USER_SCRIPT_RUNNER_FUNCTION_NAME,
  USER_SCRIPT_RUNNER_PAYLOAD_LIMIT_BYTES,
  USER_SCRIPT_RUNNER_SOURCE_URL_EXPIRY_MS,
  UserScriptRunnerEvent,
  UserScriptRunnerRequest,
  UserScriptRunnerResult,
} from '@qpqjs/core';

import { randomUUID } from 'crypto';

import { getConfigRuntimeResourceNameFromConfig } from '../../../../awsNamingUtils';
import { executeLambdaByName } from '../../../../logic/lambda/executeLambdaByName';
import { UserScriptRunnerErrorCatalog } from './UserScriptRunnerErrorCatalog';
import { UserScriptRunnerSource } from './UserScriptRunnerSource';

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

// What lambda's invoke failures look like from the caller's side; anything else means the
// runner itself is unavailable.
const classifyInvokeError = (message: string, errorType: UserScriptRunnerErrorCatalog): string => {
  if (/timed out/i.test(message)) {
    return errorType.Timeout;
  }
  if (/payload size|RequestEntityTooLarge/i.test(message)) {
    return errorType.PayloadTooLarge ?? errorType.RunnerUnavailable;
  }
  return errorType.RunnerUnavailable;
};

export type RequestUserScriptRunnerInput = {
  qpqConfig: QPQConfig;
  source: UserScriptRunnerSource;
  request: UserScriptRunnerRequest;
  // Prefix for error messages, e.g. `drive:path#fn`.
  label: string;
  errorType: UserScriptRunnerErrorCatalog;
  session: StorySession;
  actionProcessors: ActionProcessorList;
  logger: QpqLogger;
  dynamicModuleLoader: DynamicModuleLoader;
  streamRegistry: StreamRegistry;
};

/**
 * Sends one request about a built script to the service's runner function and returns its
 * answer: refuses when the service declares no runner, mints a temporary read URL for the
 * file (the host has the drive permissions, the runner only ever fetches), checks the invoke
 * size cap, and classifies invoke failures. Every failure is in the caller's catalog or is
 * the runner's own error passed through.
 */
export const requestUserScriptRunner = async <R>(input: RequestUserScriptRunnerInput): Promise<ActionProcessorResult<R>> => {
  const { qpqConfig, source, errorType, label } = input;

  if (!qpqCoreUtils.getUserScriptRunner(qpqConfig)) {
    return actionResultError(errorType.RunnerUnavailable, 'This service has no user script runner: add defineUserScriptRunner() to its config');
  }

  const resolveStory = createNestedRuntime(
    qpqConfig,
    input.session,
    input.actionProcessors,
    getDateNow,
    input.logger,
    randomUUID,
    QpqRuntimeType.EXECUTE_STORY,
    input.dynamicModuleLoader,
    undefined,
    [],
    input.streamRegistry,
  );

  const urlResult = await resolveStory(
    () => askFileGenerateTemporarySecureUrl(source.drive, source.filepath, USER_SCRIPT_RUNNER_SOURCE_URL_EXPIRY_MS, source.scope),
    [],
  );
  if (urlResult.error) {
    const urlErrorType =
      urlResult.error.errorType === askFileGenerateTemporarySecureUrl.errorType.InvalidScope ? errorType.InvalidScope : urlResult.error.errorType;
    return actionResultError(urlErrorType, urlResult.error.errorText);
  }

  const event: UserScriptRunnerEvent = {
    sourceUrl: urlResult.result as string,
    filename: source.filepath,
    storySession: toCrossServiceSession(input.session),
    request: input.request,
  };

  const eventBytes = Buffer.byteLength(JSON.stringify(event));
  if (eventBytes > USER_SCRIPT_RUNNER_PAYLOAD_LIMIT_BYTES) {
    return actionResultError(
      errorType.PayloadTooLarge ?? errorType.RunnerUnavailable,
      `[${label}] request is ${eventBytes} bytes; the runner accepts at most ${USER_SCRIPT_RUNNER_PAYLOAD_LIMIT_BYTES}`,
    );
  }

  const functionName = getConfigRuntimeResourceNameFromConfig(USER_SCRIPT_RUNNER_FUNCTION_NAME, qpqConfig);
  const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

  let result: UserScriptRunnerResult | undefined;
  try {
    result = await executeLambdaByName<UserScriptRunnerResult>(functionName, region, event, false);
  } catch (error) {
    const message = getErrorMessage(error);
    return actionResultError(classifyInvokeError(message, errorType), `[${label}] runner invoke failed: ${message}`);
  }

  if (!result || typeof result.success !== 'boolean') {
    return actionResultError(errorType.RunnerUnavailable, `[${label}] runner answered without a result`);
  }

  if (!result.success) {
    return actionResultError(result.error.errorType, result.error.errorText, result.error.errorStack);
  }

  return actionResult<R>(result.result as R);
};
