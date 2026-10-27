/**
 * The framework packages a host runtime provides to code loaded at run time (a
 * federated remote, a user script), so that code resolves the host's own module
 * instances instead of bundling its own. One list for the lambda federation host, the
 * remote builds and the user-script loader, so none of them can drift.
 */
export const FEDERATED_SHARED_PACKAGE_NAMES = ['quidproquo-core', 'quidproquo-webserver'] as const;
