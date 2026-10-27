// The auth system stores its user directory name as a global so the bundled
// handler stories can resolve it at runtime (mirrors the `qpq-serviceNames`
// pattern). One auth directory per service deployment.
export const AUTH_USER_DIRECTORY_GLOBAL_KEY = 'qpq-auth-user-directory';
