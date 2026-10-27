// ─────────────────────────────────────────────────────────────────────────────
// The BUILD half of federation, shared by both build steps:
//   getRspackConfigForQpqRemote -> uses `exposes` to build the MF container
//   publishFederatedRemote      -> uses `runtimeExposeMap` for the manifest
//
// It walks every QpqFunctionRuntime the config references (a story reachable from a
// route/queue/schedule/etc.) and produces TWO maps keyed off one derived `exposePath`
// per source file. See FederatedRemoteInfo below for what each map is for.
// ─────────────────────────────────────────────────────────────────────────────
import { getFederatedKeyFromQpqFunctionRuntime, QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import crypto from 'crypto';
import path from 'path';

import { getFullSrcPathFromQpqFunctionRuntime } from '../plugins/getFullSrcPathFromQpqFunctionRuntime';
import { getFederatedContainerName } from './getFederatedContainerName';

export type FederatedRemoteInfo = {
  // Module federation container name (a valid js identifier derived from the service name).
  containerName: string;

  serviceName: string;

  // For the ModuleFederationPlugin.exposes: exposeKey ('./src/routes/getOrders')
  // -> ABSOLUTE source path rspack should compile ('/abs/root/src/routes/getOrders').
  exposes: Record<string, string>;

  // For the runtime manifest: machine-independent runtime key
  // (getFederatedKeyFromQpqFunctionRuntime) -> expose path WITHOUT the './' prefix
  // ('src/routes/getOrders'). The lambda loader looks a runtime up here instead of
  // re-deriving expose paths, and the key is machine-independent so a remote published
  // on one machine matches a lambda shell built on another.
  runtimeExposeMap: Record<string, string>;
};

// The stable expose path for a source file. Normally the file's path relative to the
// config root (e.g. 'src/routes/getOrders'). For a source OUTSIDE the config root
// (library-provided advanced runtimes, whose absolute path differs per machine), fall
// back to a hash so the expose key stays a valid, collision-free identifier.
const getExposePathForFullSrcPath = (fullSrcPath: string, configRoot: string): string => {
  const relativeToRoot = path.relative(configRoot, fullSrcPath).replace(/\\/g, '/');

  if (relativeToRoot && !relativeToRoot.startsWith('..') && !path.isAbsolute(relativeToRoot)) {
    return relativeToRoot;
  }

  const pathHash = crypto.createHash('sha256').update(fullSrcPath).digest('hex').slice(0, 16);
  return `external/${pathHash}/${path.basename(fullSrcPath)}`;
};

export const getFederatedRemoteInfoForQpqConfig = (qpqConfig: QPQConfig): FederatedRemoteInfo => {
  // Every story the service can run, from core (queues/schedules/inline fns/...) and
  // webserver (routes/service functions/websockets/...).
  const allRuntimes = [...qpqCoreUtils.getAllSrcEntries(qpqConfig), ...qpqWebServerUtils.getAllSrcEntries(qpqConfig)];
  const configRoot = qpqCoreUtils.getApplicationConfigRoot(qpqConfig);
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);

  const exposes: Record<string, string> = {};
  const runtimeExposeMap: Record<string, string> = {};

  // One expose per source FILE (multiple runtimes in the same file dedupe to the same
  // exposePath); the specific export is picked later, at load time, by story name.
  for (const qpqFunctionRuntime of allRuntimes) {
    const fullSrcPath: string = getFullSrcPathFromQpqFunctionRuntime(qpqFunctionRuntime, qpqConfig);
    const exposePath = getExposePathForFullSrcPath(fullSrcPath, configRoot);

    // build: compile this absolute source under the './<exposePath>' key.
    exposes[`./${exposePath}`] = fullSrcPath;
    // manifest: let the loader map a runtime back to that same expose path.
    runtimeExposeMap[getFederatedKeyFromQpqFunctionRuntime(qpqFunctionRuntime)] = exposePath;
  }

  return {
    containerName: getFederatedContainerName(serviceName),
    serviceName,
    exposes,
    runtimeExposeMap,
  };
};
