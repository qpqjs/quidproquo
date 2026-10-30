/**
 * Subdomain of the web entry that holds every service's federated views, each under `/<service>`.
 * The views build bakes remote urls against it, so the entry that serves the remotes must use it.
 */
// TODO: @joe-coady: We need to pass this into the build system.
export const FEDERATED_VIEWS_SUBDOMAIN = 'views';
