import { runUserScriptInChild } from '@qpqjs/actionprocessor-node';
import {
  ActionProcessorList,
  ActionProcessorResult,
  actionResult,
  actionResultError,
  askFileGenerateTemporarySecureUrl,
  createNestedRuntime,
  DynamicModuleLoader,
  generateUuid,
  getDateNow,
  QPQConfig,
  qpqCoreUtils,
  QpqLogger,
  QpqRuntimeType,
  StorySession,
  StreamRegistry,
  toCrossServiceSession,
  USER_SCRIPT_RUNNER_PAYLOAD_LIMIT_BYTES,
  USER_SCRIPT_RUNNER_SOURCE_URL_EXPIRY_MS,
  UserScriptRunnerEvent,
  UserScriptRunnerRequest,
} from '@qpqjs/core';

import { ResolvedDevServerConfig } from '../../../../types';
import { getUserScriptChildEnv } from './getUserScriptChildEnv';

/** The error names an action that goes through the child must carry; PayloadTooLarge only where the request carries args. */
export type UserScriptChildErrorCatalog = {
  InvalidScope: string;
  RunnerUnavailable: string;
  Timeout: string;
  PayloadTooLarge?: string;
};

// Secure urls are minted on the address browsers use (a container's public host); the child
// runs beside the server, so it fetches on the server's own listener instead.
const toLocalSecureUrl = (url: string, devServerConfig: ResolvedDevServerConfig): string => {
  const local = new URL(url);
  local.hostname = 'localhost';
  local.port = `${devServerConfig.fileStorageConfig.secureUrlPort}`;
  return local.toString();
};

export type RequestUserScriptChildInput = {
  devServerConfig: ResolvedDevServerConfig;
  qpqConfig: QPQConfig;
  source: { drive: string; filepath: string; scope?: string };
  request: UserScriptRunnerRequest;
  // Prefix for error messages, e.g. `drive:path#fn`.
  label: string;
  errorType: UserScriptChildErrorCatalog;
  session: StorySession;
  actionProcessors: ActionProcessorList;
  logger: QpqLogger;
  dynamicModuleLoader: DynamicModuleLoader;
  streamRegistry: StreamRegistry;
};

/**
 * Sends one request about a built script to a fresh child process and returns its answer,
 * with the same gates, limits and errors as the lambda runner: the service must declare a
 * runner, the file is fetched by temporary URL, the request and the answer are capped at the
 * invoke size, and the child is killed at the runner's timeout.
 */
export const requestUserScriptChild = async <R>(input: RequestUserScriptChildInput): Promise<ActionProcessorResult<R>> => {
  const { devServerConfig, qpqConfig, source, errorType, label } = input;

  const runner = qpqCoreUtils.getUserScriptRunnerConfig(qpqConfig);
  if (!runner) {
    return actionResultError(errorType.RunnerUnavailable, 'This service has no user script runner: add defineUserScriptRunner() to its config');
  }
  if (!devServerConfig.userScriptChildModulePath) {
    return actionResultError(errorType.RunnerUnavailable, 'This dev server was started without a user script child bundle');
  }

  const resolveStory = createNestedRuntime(
    qpqConfig,
    input.session,
    input.actionProcessors,
    getDateNow,
    input.logger,
    generateUuid,
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
    sourceUrl: toLocalSecureUrl(urlResult.result as string, devServerConfig),
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

  const result = await runUserScriptInChild({
    modulePath: devServerConfig.userScriptChildModulePath,
    event,
    timeoutMs: runner.timeoutInSeconds * 1000,
    env: getUserScriptChildEnv(),
    args: [qpqCoreUtils.getApplicationModuleName(qpqConfig)],
  });

  if (!result.success) {
    return actionResultError(result.error.errorType, result.error.errorText, result.error.errorStack);
  }

  const resultBytes = Buffer.byteLength(JSON.stringify(result.result ?? null));
  if (resultBytes > USER_SCRIPT_RUNNER_PAYLOAD_LIMIT_BYTES) {
    return actionResultError(
      errorType.PayloadTooLarge ?? errorType.RunnerUnavailable,
      `[${label}] result is ${resultBytes} bytes; the runner returns at most ${USER_SCRIPT_RUNNER_PAYLOAD_LIMIT_BYTES}`,
    );
  }

  return actionResult<R>(result.result as R);
};
