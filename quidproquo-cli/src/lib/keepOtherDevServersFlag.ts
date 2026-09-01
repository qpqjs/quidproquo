// Opt out of the pre-start sweep that kills anything already holding the dev
// ports, including a dev server belonging to a different checkout of the same
// repo. Off by default, so the existing behaviour is unchanged.
//
// One flag rather than one per command: `go:dev` hands the same argv to both
// `go:dev:api` and `go:dev:web`, so declaring it once covers all three.
export const KEEP_OTHER_DEV_SERVERS_FLAG = '--keep-other-dev-servers';
