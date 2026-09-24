/**
 * A scoped probe drive: every call must carry a scope, and an unscoped one is
 * refused. Its create and delete events also feed the file event test.
 */
export const SMOKE_SCOPED_PROBE_DRIVE = 'smoke-scoped-probe';
