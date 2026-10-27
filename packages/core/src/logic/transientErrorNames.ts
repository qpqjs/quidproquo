/**
 * AWS / runtime error names that mean "try again shortly", not "this will never work".
 *
 * These are RATE and CAPACITY signals, not faults in the request. A throttled DynamoDB write or a
 * throttled Lambda invoke is a statement about the last few seconds of traffic, and the identical call a
 * moment later usually succeeds.
 *
 * They matter because the default classification is the opposite. An unmapped error name falls through to
 * GenericError, which callers reasonably treat as terminal — so a caller with retry machinery available
 * will not use it, and a caller that records failures durably will record a permanent failure for
 * something that was only ever momentary. That was observed in DocGen: a 300-record fanned-out batch put
 * ~100 concurrent flows against DynamoDB, 64 records came back `ThrottlingException`, and every one was
 * written down as a failed run rather than retried.
 *
 * Mapping them to OutOfResources gives callers a single typed thing to branch on, instead of matching
 * substrings against error text.
 */
export const TRANSIENT_ERROR_NAMES: ReadonlySet<string> = new Set([
  // Generic AWS SDK throttle, used by DynamoDB, SQS, Lambda and others.
  'ThrottlingException',
  'Throttling',
  'ThrottledException',
  'RequestThrottled',
  'RequestThrottledException',
  'TooManyRequestsException',
  // DynamoDB capacity.
  'ProvisionedThroughputExceededException',
  'RequestLimitExceeded',
  // Lambda concurrency.
  'EC2ThrottledException',
  // Transient service-side failures — retrying is the documented response to both.
  'ServiceUnavailable',
  'InternalServerError',
  'InternalFailure',
  'ServiceException',
  // Network-level interruptions.
  'TimeoutError',
  'RequestTimeout',
  'RequestTimeoutException',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'ENOTFOUND',
]);

/** Whether an error name or OS code names a transient, worth-retrying condition. */
export const isTransientErrorName = (name?: string): boolean => !!name && TRANSIENT_ERROR_NAMES.has(name);

// TODO: This is a shit file, we should do this a better way,
