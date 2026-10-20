import { AwsServiceAccountInfoQPQConfigSetting, QPQAwsConfigSettingType } from 'quidproquo-config-aws';
import {
  filterLogHistoryByActionTypes,
  LogActionType,
  QPQ_LOGS_STORAGE_DRIVE_NAME,
  QPQConfig,
  qpqCoreUtils,
  QpqLogger,
  StoryResult,
  StorySession,
} from 'quidproquo-core';

import * as fs from 'fs/promises';
import * as path from 'path';

import { ResolvedDevServerConfig } from '../types';

// A service turns its logs off with defineAwsServiceAccountInfo's `disableLogs`. Honoured here as on
// Lambda, so the one switch works on both; a service without that setting keeps logging.
const isServiceLoggingDisabled = (qpqConfig: QPQConfig): boolean =>
  qpqCoreUtils
    .getConfigSettings<AwsServiceAccountInfoQPQConfigSetting>(qpqConfig, QPQAwsConfigSettingType.awsServiceAccountInfo)
    .some((setting) => setting.disableLogs);

export const getDevServerLogger = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig, storySession?: StorySession): QpqLogger => {
  // Check if we're processing a storage event from the qpq-logs drive
  const isProcessingLogDriveEvent = storySession?.context?.storageEvent?.drive === QPQ_LOGS_STORAGE_DRIVE_NAME;

  // If we have no log service, the service has its logs turned off, or we're processing logs drive
  // events, return a no-op logger
  if (
    !devServerConfig.logServiceName ||
    isServiceLoggingDisabled(qpqConfig) ||
    isProcessingLogDriveEvent ||
    process.env.storageDriveName === QPQ_LOGS_STORAGE_DRIVE_NAME
  ) {
    return {
      enableLogs: async () => {},
      log: () => {},
      waitToFinishWriting: async () => {},
      moveToPermanentStorage: async () => {},
    };
  }

  const logServiceName = devServerConfig.logServiceName;
  const storagePath = devServerConfig.fileStorageConfig.storagePath;

  // Construct the log directory path: {storagePath}/{logServiceName}/qpq-logs/
  const logDirectory = path.join(storagePath, logServiceName, QPQ_LOGS_STORAGE_DRIVE_NAME);

  const logs: Promise<void>[] = [];
  let disabledLogCorrelations: string[] = [];

  // Helper function to write a log file
  const writeLogFile = async (result: StoryResult<any>): Promise<void> => {
    try {
      // Ensure the log directory exists
      await fs.mkdir(logDirectory, { recursive: true });

      // Write the log file
      const logFilePath = path.join(logDirectory, `${result.correlation}.json`);
      await fs.writeFile(logFilePath, JSON.stringify(result, null, 2), 'utf8');
    } catch (error) {
      console.error(`Failed to log story result to file [${result.correlation}]:`, error);
    }
  };

  return {
    enableLogs: async (enable: boolean, reason: string, correlation: string) => {
      if (!enable) {
        disabledLogCorrelations = [...disabledLogCorrelations, correlation];
      } else {
        disabledLogCorrelations = disabledLogCorrelations.filter((dlc) => dlc !== correlation);
      }
    },

    log: (result: StoryResult<any>) => {
      // Defer all work to a microtask so the caller is not blocked.
      // The promise is tracked in `logs` and awaited by waitToFinishWriting at the end.
      const promise = Promise.resolve()
        .then(async () => {
          const modifiableResult = !disabledLogCorrelations.includes(result.correlation)
            ? result
            : {
                ...result,
                history: filterLogHistoryByActionTypes(result.history, [
                  LogActionType.Create,
                  LogActionType.TemplateLiteral,
                  LogActionType.DisableEventHistory,
                ]),
              };

          await writeLogFile(modifiableResult);
        })
        .catch((e) => {
          console.log('Failed to log story result', JSON.stringify(e, null, 2));
        });

      logs.push(promise);
    },

    waitToFinishWriting: async () => {
      await Promise.all(logs);
    },

    moveToPermanentStorage: async () => {
      // In the dev server, logs are already in permanent storage (file system)
      // This is a no-op, but could be extended if needed
      console.log('Dev server logs are already in permanent storage');
    },
  };
};
