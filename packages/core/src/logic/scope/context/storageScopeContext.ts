import { Nullable } from '../../../types/Nullable';
import { createContextIdentifier } from '../../context/createContextIdentifier';

// The ambient storage scope: THE value scope-aware data layers (e.g. the
// eventDoc feature) forward as the File/KVS `scope` option. Null = unscoped.
//
// Deliberately NON-local: the scope rides the serialized session context across
// queue/service boundaries, so async work spawned inside a scoped request (a
// render job, an AI edit) reads and writes the same partition as the request
// that started it.
export const storageScopeContext = createContextIdentifier<Nullable<string>>('qpq-storage-scope', null);
