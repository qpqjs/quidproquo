import { LogLevelEnum } from 'quidproquo-core';

export type LogLog = {
  type: LogLevelEnum;
  timestamp: string;

  reason: string;

  // We sometimes create logs not from a service executing something (like a lambda error)
  module?: string;
  fromCorrelation?: string;
  logIndex?: number;

  ttl?: number;
};
