export enum SmokeTestStatus {
  pending = 'pending',
  running = 'running',
  passed = 'passed',
  failed = 'failed',
  // Deployed-only test on a platform with no equivalent; never queued, never counts either way.
  skipped = 'skipped',
}
