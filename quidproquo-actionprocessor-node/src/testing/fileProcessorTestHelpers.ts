import {
  ActionProcessorList,
  ActionProcessorListResolver,
  buildTestQpqConfig,
  defineStorageDrive,
  DynamicModuleLoader,
  FileActionType,
} from 'quidproquo-core';

import { FileStorageConfig } from '../dynamicActionProcessor/file/types';

// Shared fixtures for the local-filesystem file action processor tests. Every processor
// is resolved against the same fake config: an open 'media' drive and a scoped 'tenantMedia'.
export const fileConfig: FileStorageConfig = {
  storagePath: '/storage',
  secureUrlPort: 4000,
  secureUrlPublicPort: 4000,
  secureUrlHost: 'localhost',
  secureUrlSecret: 'secret',
};

// 'tenantMedia' is the scoped drive: every call on it must carry a scope.
const qpqConfig = buildTestQpqConfig([defineStorageDrive('media'), defineStorageDrive('tenantMedia', { scoped: true })]);

// Builds an Error carrying a node-style `code` (e.g. ENOENT) so mocked fs calls reject the
// same way the real fs/promises module does.
export const errorWithCode = (code: string) => Object.assign(new Error(code), { code });

// Resolves a file action processor list against the shared 'media' config. The dynamic
// module loader is irrelevant to the filesystem processors, so a noop is passed.
export const resolveFileProcessors = (resolver: ActionProcessorListResolver): Promise<ActionProcessorList> =>
  resolver(qpqConfig, (() => null) as unknown as DynamicModuleLoader);

// Resolves and invokes a single file action processor for the 'media' drive.
export const runFileAction = async (
  resolver: ActionProcessorListResolver,
  actionType: FileActionType,
  payload: Record<string, unknown>,
): Promise<any> => {
  const processors = await resolveFileProcessors(resolver);
  const process = processors[actionType] as (payload: Record<string, unknown>) => Promise<any>;
  return process({ drive: 'media', ...payload });
};
