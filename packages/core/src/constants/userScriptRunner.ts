/** Resource name of a service's user-script runner function, derived into the full name per runtime. */
export const USER_SCRIPT_RUNNER_FUNCTION_NAME = 'uscript-runner';

/** Lambda's synchronous invoke limit on a request and on a response, which bounds a script's args and result. */
export const USER_SCRIPT_RUNNER_PAYLOAD_LIMIT_BYTES = 6 * 1024 * 1024;

/** How long the temporary read URL for a built script stays valid: long enough for the runner to fetch it, no more. */
export const USER_SCRIPT_RUNNER_SOURCE_URL_EXPIRY_MS = 5 * 60 * 1000;
