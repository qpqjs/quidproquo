import { runUserScriptInChild } from 'quidproquo-actionprocessor-node';
import {
  ActionProcessorList,
  actionResult,
  actionResultError,
  askFileGenerateTemporarySecureUrl,
  askUserScriptExecuteBase,
  createActionProcessor,
  createNestedRuntime,
  DynamicModuleLoader,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
  QpqLogger,
  QpqRuntimeType,
  StorySession,
  StorySessionUpdater,
  StreamRegistry,
  toCrossServiceSession,
  USER_SCRIPT_RUNNER_PAYLOAD_LIMIT_BYTES,
  USER_SCRIPT_RUNNER_SOURCE_URL_EXPIRY_MS,
  UserScriptExecuteActionPayload,
  UserScriptRunnerEvent,
} from 'quidproquo-core';

import { randomUUID } from 'crypto';

import { ResolvedDevServerConfig } from '../../../types';
import { getUserScriptChildEnv } from './getUserScriptChildEnv';

const { errorType } = askUserScriptExecuteBase;

const getDateNow = () => new Date().toISOString();

const URL_ERROR_TYPES: Record<string, string> = {
  [askFileGenerateTemporarySecureUrl.errorType.InvalidScope]: errorType.InvalidScope,
};

// Secure urls are minted on the address browsers use (a container's public host); the child
// runs beside the server, so it fetches on the server's own listener instead.
const toLocalSecureUrl = (url: string, devServerConfig: ResolvedDevServerConfig): string => {
  const local = new URL(url);
  local.hostname = 'localhost';
  local.port = `${devServerConfig.fileStorageConfig.secureUrlPort}`;
  return local.toString();
};

const getProcessExecute =
  (devServerConfig: ResolvedDevServerConfig) =>
  <R>(qpqConfig: QPQConfig): ProcessorFor<typeof askUserScriptExecuteBase> => {
    return async (
      payload: UserScriptExecuteActionPayload,
      session: StorySession,
      actionProcessors: ActionProcessorList,
      logger: QpqLogger,
      updateSession: StorySessionUpdater,
      dynamicModuleLoader: DynamicModuleLoader,
      streamRegistry: StreamRegistry,
    ): Promise<any> => {
      // The same gate as lambda, so a service that forgot the runner fails locally too.
      const runner = qpqCoreUtils.getUserScriptRunner(qpqConfig);
      if (!runner) {
        return actionResultError(errorType.RunnerUnavailable, 'This service has no user script runner: add defineUserScriptRunner() to its config');
      }
      if (!devServerConfig.userScriptChildModulePath) {
        return actionResultError(errorType.RunnerUnavailable, 'This dev server was started without a user script child bundle');
      }

      const resolveStory = createNestedRuntime(
        qpqConfig,
        session,
        actionProcessors,
        getDateNow,
        logger,
        randomUUID,
        QpqRuntimeType.EXECUTE_STORY,
        dynamicModuleLoader,
        undefined,
        [],
        streamRegistry,
      );

      const urlResult = await resolveStory(
        () => askFileGenerateTemporarySecureUrl(payload.drive, payload.filepath, USER_SCRIPT_RUNNER_SOURCE_URL_EXPIRY_MS, payload.scope),
        [],
      );
      if (urlResult.error) {
        return actionResultError(URL_ERROR_TYPES[urlResult.error.errorType] ?? urlResult.error.errorType, urlResult.error.errorText);
      }

      const event: UserScriptRunnerEvent = {
        sourceUrl: toLocalSecureUrl(urlResult.result as string, devServerConfig),
        filename: payload.filepath,
        functionName: payload.functionName,
        args: payload.args,
        storySession: toCrossServiceSession(session),
      };

      const label = `${payload.drive}:${payload.filepath}#${payload.functionName}`;
      const eventBytes = Buffer.byteLength(JSON.stringify(event));
      if (eventBytes > USER_SCRIPT_RUNNER_PAYLOAD_LIMIT_BYTES) {
        return actionResultError(
          errorType.PayloadTooLarge,
          `[${label}] args are ${eventBytes} bytes; the runner accepts at most ${USER_SCRIPT_RUNNER_PAYLOAD_LIMIT_BYTES}`,
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
          errorType.PayloadTooLarge,
          `[${label}] result is ${resultBytes} bytes; the runner returns at most ${USER_SCRIPT_RUNNER_PAYLOAD_LIMIT_BYTES}`,
        );
      }

      return actionResult<R>(result.result as R);
    };
  };

/** The dev server's execute: runs the script in a child process with the same limits and errors as the lambda runner. */
export const getUserScriptExecuteActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserScriptExecuteBase, getProcessExecute(devServerConfig));
