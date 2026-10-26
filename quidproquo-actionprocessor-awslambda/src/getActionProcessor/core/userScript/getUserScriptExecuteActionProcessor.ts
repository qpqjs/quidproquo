import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
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
  USER_SCRIPT_RUNNER_FUNCTION_NAME,
  USER_SCRIPT_RUNNER_PAYLOAD_LIMIT_BYTES,
  USER_SCRIPT_RUNNER_SOURCE_URL_EXPIRY_MS,
  UserScriptExecuteActionPayload,
  UserScriptRunnerEvent,
  UserScriptRunnerResult,
} from 'quidproquo-core';

import { randomUUID } from 'crypto';

import { getConfigRuntimeResourceNameFromConfig } from '../../../awsNamingUtils';
import { executeLambdaByName } from '../../../logic/lambda/executeLambdaByName';

const { errorType } = askUserScriptExecuteBase;

const getDateNow = () => new Date().toISOString();

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

// The secure-url action's typed errors re-labelled into this action's catalog; a missing
// file surfaces when the runner fetches, so only the scope refusal is known here.
const URL_ERROR_TYPES: Record<string, string> = {
  [askFileGenerateTemporarySecureUrl.errorType.InvalidScope]: errorType.InvalidScope,
};

// What lambda's invoke failures look like from the caller's side; anything else means the
// runner itself is unavailable.
const classifyInvokeError = (message: string): string => {
  if (/timed out/i.test(message)) {
    return errorType.TimedOut;
  }
  if (/payload size|RequestEntityTooLarge/i.test(message)) {
    return errorType.PayloadTooLarge;
  }
  return errorType.RunnerUnavailable;
};

const getProcessExecute = <R>(qpqConfig: QPQConfig): ProcessorFor<typeof askUserScriptExecuteBase> => {
  return async (
    payload: UserScriptExecuteActionPayload,
    session: StorySession,
    actionProcessors: ActionProcessorList,
    logger: QpqLogger,
    updateSession: StorySessionUpdater,
    dynamicModuleLoader: DynamicModuleLoader,
    streamRegistry: StreamRegistry,
  ): Promise<any> => {
    if (!qpqCoreUtils.getUserScriptRunner(qpqConfig)) {
      return actionResultError(errorType.RunnerUnavailable, 'This service has no user script runner: add defineUserScriptRunner() to its config');
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

    // The host, with its drive permissions, mints the read URL; the runner only ever fetches it.
    const urlResult = await resolveStory(
      () => askFileGenerateTemporarySecureUrl(payload.drive, payload.filepath, USER_SCRIPT_RUNNER_SOURCE_URL_EXPIRY_MS, payload.scope),
      [],
    );
    if (urlResult.error) {
      return actionResultError(URL_ERROR_TYPES[urlResult.error.errorType] ?? urlResult.error.errorType, urlResult.error.errorText);
    }

    const event: UserScriptRunnerEvent = {
      sourceUrl: urlResult.result as string,
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

    const functionName = getConfigRuntimeResourceNameFromConfig(USER_SCRIPT_RUNNER_FUNCTION_NAME, qpqConfig);
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    let result: UserScriptRunnerResult | undefined;
    try {
      result = await executeLambdaByName<UserScriptRunnerResult>(functionName, region, event, false);
    } catch (error) {
      const message = getErrorMessage(error);
      return actionResultError(classifyInvokeError(message), `[${label}] runner invoke failed: ${message}`);
    }

    if (!result || typeof result.success !== 'boolean') {
      return actionResultError(errorType.RunnerUnavailable, `[${label}] runner answered without a result`);
    }

    if (!result.success) {
      return actionResultError(result.error.errorType, result.error.errorText, result.error.errorStack);
    }

    return actionResult<R>(result.result as R);
  };
};

/** The lambda runtime's execute: hands the call to the service's sandboxed runner function instead of running the script in-process. */
export const getUserScriptExecuteActionProcessor = createActionProcessor(askUserScriptExecuteBase, getProcessExecute);
