import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import * as quidproquoCore from '@qpqjs/core';
import { FEDERATED_SHARED_PACKAGE_NAMES, getFederatedKeyFromQpqFunctionRuntime, QPQConfig, qpqCoreUtils, QpqFunctionRuntime } from '@qpqjs/core';
import * as quidproquoWebserver from '@qpqjs/webserver';

import * as fs from 'fs';
import { createRequire } from 'module';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { init, loadRemote, registerRemotes } from '@module-federation/enhanced/runtime';

import { createAwsClient } from '../createAwsClient';
import { FederatedModuleLoadError, FederatedModuleLoadErrorCode } from './FederatedModuleLoadError';
import { FederatedModuleStoreManifest } from './FederatedModuleStoreManifest';

// ─────────────────────────────────────────────────────────────────────────────
// loadFederatedStory: the RUNTIME half of module federation on lambda. Given a
// QpqFunctionRuntime, it returns the published story function from the service's
// code store, or undefined so dynamicModuleLoader falls back to the bundled copy.
//
// WHERE THE STORE COMES FROM
//   process.env.federatedCodeStoreUrl = "s3://<bucket>/<service>" is set on every
//   lambda by the CDK Function construct when the service declared
//   defineFederatedModuleStore(...). The build/publish half (@qpqjs/deploy-rspack)
//   put the artifacts there. The two halves agree via FederatedModuleStoreManifest and
//   the machine-independent key getFederatedKeyFromQpqFunctionRuntime (in core).
//
// FLOW (per lambda container)
//   loadFederatedStory(runtime)
//     └─ resolveStore()                 cache the store decision; re-probe on a TTL
//         └─ probeStore()               read manifest.json; new hash? -> loadStoreVersion()
//             └─ loadStoreVersion()     sync files to /tmp, require container, register w/ MF
//     └─ manifest.exposes[key]          machine-independent runtime key -> expose path
//     └─ loadRemote(container/expose)   MF hands back the module; return module[storyName]
//
// CACHING (state below): a resolved 'available' store is served instantly from memory;
// the manifest is re-checked in the BACKGROUND every recheck interval so a warm
// container picks up a newly published version without a redeploy. Every miss or error
// returns undefined -> the caller uses the statically bundled module instead.
// ─────────────────────────────────────────────────────────────────────────────

// ── Module-level cache (per lambda execution environment / warm container) ───────
// This state persists across invocations in the same container. resetFederatedModule-
// StoreCache() clears it (tests only). 'available' carries the loaded manifest + the
// MF remote name to loadRemote from; 'unavailable' means "run the bundled fallback".
type StoreState = { available: true; manifest: FederatedModuleStoreManifest; runtimeName: string } | { available: false };

// How long a resolved state is served before the manifest is re-checked for a new
// version. Overridable per service (defineFederatedModuleStore recheckMs -> this env).
// Lower = faster pickup of new publishes at the cost of one small S3 GET per container
// per interval. The re-check runs in the BACKGROUND so it never blocks a request.
const DEFAULT_RECHECK_MS = 60_000;

const getRecheckMs = (): number => {
  const raw = process.env.federatedCodeStoreRecheckMs;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_RECHECK_MS;
};

let resolvedState: StoreState | undefined;
let recheckAfter = 0;
let inflightResolve: Promise<StoreState> | undefined;
let hostInitialised = false;

// Test seam - forces the next call to re-resolve the store from env.
export const resetFederatedModuleStoreCache = (): void => {
  resolvedState = undefined;
  recheckAfter = 0;
  inflightResolve = undefined;
};

// ── Transport ────────────────────────────────────────────────────────────────
// Returns a function that reads a path RELATIVE to the store (e.g. 'manifest.json'
// or '<hash>/remoteEntry.js'). Two backends: s3:// for real deploys, file:// for
// local/dev and tests. The store URL already includes the per-service prefix, so
// callers pass only the in-service relative path.
const getFileFetcher = (storeUrl: string, qpqConfig: QPQConfig): ((relativePath: string) => Promise<Buffer>) => {
  if (storeUrl.startsWith('s3://')) {
    const url = new URL(storeUrl);
    const bucketName = url.host;
    const keyPrefix = url.pathname.replace(/^\/|\/$/g, '');
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);
    // Pin the owner so a same-name bucket in another account can't be squatted to
    // serve code we'd then require() with the service role's credentials.
    const expectedBucketOwner = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(qpqConfig);
    const s3Client = createAwsClient(S3Client, { region });

    return async (relativePath: string): Promise<Buffer> => {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: keyPrefix ? `${keyPrefix}/${relativePath}` : relativePath,
          ExpectedBucketOwner: expectedBucketOwner,
        }),
      );

      const bytes = await response.Body?.transformToByteArray();
      if (!bytes) {
        throw new FederatedModuleLoadError(FederatedModuleLoadErrorCode.containerLoadFailed, `empty response reading [${relativePath}]`);
      }

      return Buffer.from(bytes);
    };
  }

  if (storeUrl.startsWith('file://')) {
    const baseDirectory = fileURLToPath(storeUrl.endsWith('/') ? storeUrl : `${storeUrl}/`);

    return async (relativePath: string): Promise<Buffer> => fs.promises.readFile(path.join(baseDirectory, relativePath));
  }

  throw new FederatedModuleLoadError(FederatedModuleLoadErrorCode.unsupportedStoreUrl, `unsupported federated code store url [${storeUrl}]`);
};

// "Nothing published yet" is a legitimate not-found: the manifest key is absent
// (NoSuchKey/NotFound) or the store bucket isn't created yet, which happens normally
// when a lambda cold-starts between deploy phases (NoSuchBucket). We do NOT include
// AccessDenied: a permission failure is a real misconfiguration and must surface (as a
// warning, and be retried) rather than masquerade as 'not published'.
const isManifestNotFoundError = (error: unknown): boolean => {
  const name = (error as { name?: string })?.name || '';
  const code = (error as { code?: string })?.code || '';

  return ['NoSuchKey', 'NotFound', 'NoSuchBucket'].includes(name) || code === 'ENOENT';
};

// ── Module-federation shared scope ───────────────────────────────────────────
// The host provides the framework packages to the container's share scope so remote
// story code resolves the SAME module instances as the bundled runtime. The package
// list is shared with the remote build so the two can't drift (FEDERATED_SHARED_PACKAGE_NAMES in core).
const SHARED_LIBS: Record<string, unknown> = {
  '@qpqjs/core': quidproquoCore,
  '@qpqjs/webserver': quidproquoWebserver,
};

const getHostSharedModules = () =>
  Object.fromEntries(
    FEDERATED_SHARED_PACKAGE_NAMES.map((name) => [
      name,
      {
        version: '0.0.0',
        lib: () => SHARED_LIBS[name],
        shareConfig: { singleton: true, requiredVersion: false as const },
      },
    ]),
  );

const ensureHostInitialised = (): void => {
  if (hostInitialised) {
    return;
  }
  init({
    name: 'qpq_federated_host',
    remotes: [],
    shared: getHostSharedModules(),
  });
  hostInitialised = true;
};

// The manifest is data from the store, so every path it names is pinned under the
// directory it belongs to: a container name, hash, file or entry that resolves
// outside it (`..`, an absolute path) is a bad or hostile publish, not a location.
const resolveInside = (baseDirectory: string, relativePath: string): string => {
  const resolved = path.resolve(baseDirectory, relativePath);
  const base = path.resolve(baseDirectory);

  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) {
    throw new FederatedModuleLoadError(FederatedModuleLoadErrorCode.manifestInvalid, `manifest path [${relativePath}] escapes [${baseDirectory}]`);
  }

  return resolved;
};

// ── Version loading ──────────────────────────────────────────────────────────
// Downloads a manifest's files (atomically) and registers the container with the MF
// runtime under a HASH-UNIQUE remote name, so loadRemote can't serve a previous
// version's module from its cache when the hash changes. Returns the runtime name.
// This is the step that actually puts a new version's code into effect.
const loadStoreVersion = async (getFile: (p: string) => Promise<Buffer>, manifest: FederatedModuleStoreManifest): Promise<string> => {
  const cacheRoot = process.env.federatedCodeStoreCacheDir || '/tmp/qpq-federated-code';
  const versionDirectory = resolveInside(cacheRoot, path.join(manifest.containerName, manifest.hash));
  await fs.promises.mkdir(versionDirectory, { recursive: true });

  await Promise.all(
    manifest.files.map(async (file) => {
      const localPath = resolveInside(versionDirectory, file);
      // Files are immutable under their hash dir AND only ever appear via the atomic
      // rename below, so an existing file is always complete and valid - this is what
      // lets a re-check of an unchanged version skip re-downloading.
      if (fs.existsSync(localPath)) {
        return;
      }

      const data = await getFile(`${manifest.hash}/${file}`);
      await fs.promises.mkdir(path.dirname(localPath), { recursive: true });

      // Write to a temp name then rename: rename is atomic on the same filesystem, so a
      // crash/timeout mid-write never leaves a truncated file that a later invocation
      // would trust via the existsSync check above. The random suffix keeps concurrent
      // writers in the SAME process (overlapping probes) off each other's temp file.
      const tempPath = `${localPath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
      await fs.promises.writeFile(tempPath, data);
      await fs.promises.rename(tempPath, localPath);
    }),
  );

  const entryPath = resolveInside(versionDirectory, manifest.entry);
  const containerRequire = createRequire(entryPath);
  const containerModule = containerRequire(entryPath);
  const container = containerModule[manifest.containerName] ?? containerModule.default ?? containerModule;

  if (typeof container?.get !== 'function' || typeof container?.init !== 'function') {
    throw new FederatedModuleLoadError(
      FederatedModuleLoadErrorCode.containerLoadFailed,
      `[${manifest.entry}] does not export a module federation container named [${manifest.containerName}]`,
    );
  }

  // entryGlobalName is the container's real (build-time) library name; the registered
  // remote name is hash-unique so each version is a distinct loadRemote key.
  (globalThis as Record<string, unknown>)[manifest.containerName] = container;
  ensureHostInitialised();

  const runtimeName = `${manifest.containerName}__${manifest.hash}`;
  registerRemotes([
    {
      name: runtimeName,
      entry: entryPath,
      type: 'global',
      entryGlobalName: manifest.containerName,
    },
  ]);

  return runtimeName;
};

// ── Probe & resolve (the caching state machine) ──────────────────────────────
// Reads the manifest and decides the current state. If the hash is unchanged from what
// we already loaded, keeps the existing container (no re-sync). Not-found -> unavailable.
const probeStore = async (qpqConfig: QPQConfig, storeUrl: string, current: StoreState | undefined): Promise<StoreState> => {
  const getFile = getFileFetcher(storeUrl, qpqConfig);

  let manifest: FederatedModuleStoreManifest;
  try {
    manifest = JSON.parse((await getFile('manifest.json')).toString('utf8'));
  } catch (error) {
    if (isManifestNotFoundError(error)) {
      console.log(`federated code store [${storeUrl}] has no manifest - using bundled modules`);
      return { available: false };
    }
    throw error;
  }

  if (
    !manifest?.containerName ||
    !manifest?.hash ||
    !manifest?.entry ||
    !Array.isArray(manifest?.files) ||
    typeof manifest?.exposes !== 'object' ||
    manifest.exposes === null
  ) {
    throw new FederatedModuleLoadError(FederatedModuleLoadErrorCode.manifestInvalid, `invalid manifest in federated code store [${storeUrl}]`);
  }

  if (current?.available && current.manifest.hash === manifest.hash) {
    return current;
  }

  const runtimeName = await loadStoreVersion(getFile, manifest);
  return { available: true, manifest, runtimeName };
};

// Resolves the store, re-checking the manifest after the recheck interval. The re-check
// runs in the background: a stale-but-usable state is served immediately so a request
// never blocks on S3; only the very first resolve (no state yet) awaits.
const resolveStore = (qpqConfig: QPQConfig, storeUrl: string): Promise<StoreState> => {
  if (resolvedState && Date.now() < recheckAfter) {
    return Promise.resolve(resolvedState);
  }

  if (!inflightResolve) {
    inflightResolve = probeStore(qpqConfig, storeUrl, resolvedState)
      .then((state) => {
        resolvedState = state;
        recheckAfter = Date.now() + getRecheckMs();
        return state;
      })
      .catch((error) => {
        // Back off and keep serving whatever we had (or unavailable). Surfaced as a
        // warning so real errors (e.g. AccessDenied) are visible, not silent.
        console.warn('federated code store check failed - keeping current modules', error);
        recheckAfter = Date.now() + getRecheckMs();
        resolvedState = resolvedState ?? { available: false };
        return resolvedState;
      })
      .finally(() => {
        inflightResolve = undefined;
      });
  }

  // Serve the stale state instantly while the refresh happens; only block if we have
  // nothing yet.
  return resolvedState ? Promise.resolve(resolvedState) : inflightResolve;
};

// ── Public entry ─────────────────────────────────────────────────────────────
// Called by dynamicModuleLoader for every story load. Returns the story function, or
// undefined to signal "use the bundled module" (no store, nothing published, runtime
// not exposed, or any error - availability always wins over federation).
export const loadFederatedStory = async <T = unknown>(qpqConfig: QPQConfig, qpqFunctionRuntime: QpqFunctionRuntime): Promise<T | undefined> => {
  const storeUrl = process.env.federatedCodeStoreUrl;
  if (!storeUrl) {
    return undefined;
  }

  try {
    const storeState = await resolveStore(qpqConfig, storeUrl);
    if (!storeState.available) {
      return undefined;
    }

    const federatedKey = getFederatedKeyFromQpqFunctionRuntime(qpqFunctionRuntime);
    const exposePath = storeState.manifest.exposes[federatedKey];
    if (!exposePath) {
      console.warn(`federated code store has no module for [${federatedKey}] - using the bundled module`);
      return undefined;
    }

    const remoteModule = await loadRemote<Record<string, T>>(`${storeState.runtimeName}/${exposePath}`);

    const storyName = qpqCoreUtils.getStoryNameFromQpqFunctionRuntime(qpqFunctionRuntime);
    const story = remoteModule?.[storyName];
    if (!story) {
      throw new FederatedModuleLoadError(
        FederatedModuleLoadErrorCode.storyNotExported,
        `story [${storyName}] is not exported from federated module [${exposePath}]`,
      );
    }

    return story;
  } catch (error) {
    // Availability first: a broken store must never take the service down
    console.warn('federated module load failed - using the bundled module', error);
    return undefined;
  }
};
