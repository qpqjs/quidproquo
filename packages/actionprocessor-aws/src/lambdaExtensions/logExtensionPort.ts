// Fixed localhost port the function handler uses to reach the qpq-log-extension.
// Hardcoded on both ends: the handler and the extension always ship together, so
// there's no need to pass it through an env var.
export const LOG_EXTENSION_PORT = 9009;
