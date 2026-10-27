// ─────────────────────────────────────────────────────────────────────────────
// The JSON contract that ties the two halves of federation together:
//   WRITTEN BY   packages/deploy-webpack/src/federation/publishFederatedRemote.ts
//   READ BY      quidproquo-actionprocessor-awslambda .../loadFederatedStory.ts
//
// Store layout (under s3://<bucket>/<service>/ once uploaded):
//   manifest.json          <- THIS document, uploaded LAST (the atomic "current" pointer)
//   <hash>/<...files>      <- the immutable module-federation container build for a version
//
// The loader reads manifest.json first, so publishing = upload the <hash>/ dir, then
// overwrite manifest.json. A new `hash` is what tells a warm lambda a new version exists.
// ─────────────────────────────────────────────────────────────────────────────
export type FederatedModuleStoreManifest = {
  // MF container name (qpq_<service>). The build bakes it in as the container's library
  // name; the loader stores the loaded container on globalThis under this key.
  containerName: string;

  // qpq service/module this remote was built from (informational / debugging).
  service: string;

  // Content hash of the published files == the <hash> version directory name. Changing
  // it is the signal the loader uses to detect and hot-swap to a new version.
  hash: string;

  // Container entry file within the version directory (always 'remoteEntry.js').
  entry: string;

  // Every file in the version directory. The loader syncs exactly these (so it needs
  // GetObject only, no ListBucket) to /tmp.
  files: string[];

  // The lookup table the loader uses: machine-independent runtime key
  // (getFederatedKeyFromQpqFunctionRuntime) -> the container's expose path (no './'
  // prefix). Built on the publish side by getFederatedRemoteInfoForQpqConfig.
  exposes: Record<string, string>;
};
