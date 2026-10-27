export * from './dynamoStreamEvent_kvsStreamEvent';
// Deliberately empty. The files in this folder are bundler ENTRY POINTS, not
// library code: each one imports the 'quidproquo-dynamic-loader' virtual module
// that only exists inside a deploy bundle (see getLambdaEntries.ts). Re-exporting
// them here would drag that unresolvable import into the package's own surface.
