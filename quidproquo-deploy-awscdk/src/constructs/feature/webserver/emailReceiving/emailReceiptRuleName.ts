import { QPQConfig } from 'quidproquo-core';
import { qpqCoreUtils } from 'quidproquo-core';

/**
 * The app's rule in the account's shared receipt rule set. Carries app, environment and module
 * so every app instance in the account gets its own rule, and the landing bucket policy can
 * name it exactly.
 */
export const emailReceiptRuleName = (qpqConfig: QPQConfig, receiverName: string): string => {
  const application = qpqCoreUtils.getApplicationName(qpqConfig);
  const environment = qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);
  const module = qpqCoreUtils.getApplicationModuleName(qpqConfig);

  return `${receiverName}-${application}-${module}-${environment}`;
};
