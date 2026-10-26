import { SmokeAwsProbeOutcome } from './SmokeAwsProbeOutcome';

export type SmokeAwsProbeAttempt = {
  name: string;
  outcome: SmokeAwsProbeOutcome;
  // The error name and message, or what the call returned when it was allowed.
  detail: string;
};
