/**
 * Marks a user script module's `types` entry for the bundler: a source file required with
 * this query is not compiled but turned into a module whose `USER_SCRIPT_MODULE_TYPES_EXPORT`
 * is the entry's bundled type declarations (see defineUserScriptModule). One home for core,
 * which builds the runtime, and the bundler rule that answers it.
 */
export const USER_SCRIPT_MODULE_TYPES_QUERY = 'qpq-user-script-module-types';

/** The export of a `types` entry module holding the declarations text. */
export const USER_SCRIPT_MODULE_TYPES_EXPORT = 'declarations';
