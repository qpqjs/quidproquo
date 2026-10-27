import { createContextIdentifier } from '../context/createContextIdentifier';
import { createContextProvider } from '../context/createContextProvider';
import { createContextReader } from '../context/createContextReader';

// The ambient storage scope: THE value scope-aware data layers (e.g. the
// eventDoc feature) forward as the File/KVS `scope` option. Null = unscoped.
//
// Deliberately NON-local: the scope rides the serialized session context across
// queue/service boundaries, so async work spawned inside a scoped request (a
// render job, an AI edit) reads and writes the same partition as the request
// that started it.
export const storageScopeContext = createContextIdentifier<string | null>('qpq-storage-scope', null);

export const askStorageScopeProvide = createContextProvider(storageScopeContext, (scope: string) => scope);

export const askStorageScopeRead = createContextReader(storageScopeContext);
