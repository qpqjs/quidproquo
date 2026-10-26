// How one AWS call from inside the sandbox ended.
export enum SmokeAwsProbeOutcome {
  // The call succeeded: the sandbox reached a resource it must not.
  allowed = 'allowed',
  // AWS answered 403: credentials were presented and IAM refused them.
  denied = 'denied',
  // The SDK found no credentials to sign with.
  noCredentials = 'noCredentials',
  // Anything else (network, bad region, unexpected error).
  failed = 'failed',
}
