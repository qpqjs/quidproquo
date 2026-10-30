import { SmokeAwsProbeAttempt } from '../models/SmokeAwsProbeAttempt';
import { SmokeAwsProbeOutcome } from '../models/SmokeAwsProbeOutcome';

type AwsSdkError = {
  name?: string;
  message?: string;
  $metadata?: { httpStatusCode?: number };
};

const DENIED_NAMES = ['AccessDenied', 'AccessDeniedException'];

// Run one AWS call and record how it ended. A 403 (or an AccessDenied error name) means IAM
// refused signed credentials; the SDK's own CredentialsProviderError means it had none.
export const recordAwsProbeAttempt = async (name: string, call: () => Promise<unknown>): Promise<SmokeAwsProbeAttempt> => {
  try {
    const value = await call();
    return {
      name,
      outcome: SmokeAwsProbeOutcome.allowed,
      detail: JSON.stringify(value).slice(0, 200),
    };
  } catch (caught: unknown) {
    const error = caught as AwsSdkError;
    const detail = `${error.name ?? 'Error'}: ${error.message ?? ''}`;

    if (error.name === 'CredentialsProviderError') {
      return { name, outcome: SmokeAwsProbeOutcome.noCredentials, detail };
    }
    if (error.$metadata?.httpStatusCode === 403 || DENIED_NAMES.includes(error.name ?? '')) {
      return { name, outcome: SmokeAwsProbeOutcome.denied, detail };
    }
    return { name, outcome: SmokeAwsProbeOutcome.failed, detail };
  }
};
