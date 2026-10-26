/**
 * Region handed to the unsigned probe client. The sandbox strips AWS_REGION with the rest of
 * the AWS_* variables, and without a region the SDK fails before it ever looks for
 * credentials, which is the part the probe is testing. Any region does; the call must still
 * fail for lack of credentials.
 */
export const SMOKE_PROBE_DEFAULT_CHAIN_REGION = 'us-east-1';
