// ─────────────────────────────────────────────────────────────────────────────
// The PUBLISH step. Takes a getWebpackConfigForQpqRemote build output and turns it
// into the store layout the lambda loader expects. It does NOT upload - the caller
// copies the result into s3://<bucket>/<service>/ (version dir first, manifest last).
//
// Produces:
//   <publishPath>/<hash>/<files>   <- immutable, content-addressed container build
//   <publishPath>/manifest.json    <- written LAST: the atomic "current version" pointer
//
// The <hash> is a content hash of the build, so identical code -> identical hash (a
// no-op republish), and any change -> a new hash the warm lambdas detect and hot-swap.
// ─────────────────────────────────────────────────────────────────────────────
import type { FederatedModuleStoreManifest } from 'quidproquo-actionprocessor-awslambda';
import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import { getFederatedRemoteInfoForQpqConfig } from './getFederatedRemoteInfoForQpqConfig';

// Build metadata the runtime never touches - only the container entry + chunks ship.
const NON_RUNTIME_FILES = /^(@mf-types\.(d\.ts|zip)|mf-stats\.json)$/;

const listFilesRecursive = (dir: string, base: string = dir): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listFilesRecursive(fullPath, base) : [path.relative(base, fullPath).replace(/\\/g, '/')];
  });

export const publishFederatedRemote = (qpqConfig: QPQConfig, remoteBuildPath: string, publishPath: string): FederatedModuleStoreManifest => {
  // The container name + the runtime->expose map that goes into the manifest. Re-derived
  // from the same config the build used, so keys line up with what webpack exposed.
  const { containerName, runtimeExposeMap } = getFederatedRemoteInfoForQpqConfig(qpqConfig);

  // 1. Enumerate the runtime files (drop build metadata) and sanity-check the container.
  const files = listFilesRecursive(remoteBuildPath)
    .filter((file) => !NON_RUNTIME_FILES.test(file))
    .sort();

  if (!files.includes('remoteEntry.js')) {
    throw new Error(`no remoteEntry.js in [${remoteBuildPath}] - run the federated remote build first`);
  }

  // 2. Content-hash the files (name + bytes, in sorted order) = the version id.
  const hasher = crypto.createHash('sha256');
  for (const file of files) {
    hasher.update(file);
    hasher.update(fs.readFileSync(path.join(remoteBuildPath, file)));
  }
  const hash = hasher.digest('hex').slice(0, 12);

  // 3. Lay the files out under <publishPath>/<hash>/. rmSync clears any prior publish
  //    output first (publishPath is a dedicated scratch dir, disjoint from remoteBuildPath).
  const versionPath = path.join(publishPath, hash);
  fs.rmSync(publishPath, { recursive: true, force: true });
  fs.mkdirSync(versionPath, { recursive: true });
  for (const file of files) {
    const destination = path.join(versionPath, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(remoteBuildPath, file), destination);
  }

  // 4. Write manifest.json LAST (it points at the hash dir the loader will read).
  const manifest: FederatedModuleStoreManifest = {
    containerName,
    service: qpqCoreUtils.getApplicationModuleName(qpqConfig),
    hash,
    entry: 'remoteEntry.js',
    files,
    exposes: runtimeExposeMap,
  };

  fs.writeFileSync(path.join(publishPath, 'manifest.json'), JSON.stringify(manifest, null, 2));

  return manifest;
};
