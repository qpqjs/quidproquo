import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';

/** True when two identities name the same document; snapshot pending only ever restores into the same document. */
export const isSameEventDocWorkspaceIdentity = (a: EventDocWorkspaceDocumentIdentity, b: EventDocWorkspaceDocumentIdentity): boolean =>
  a.serviceName === b.serviceName && a.basePath === b.basePath && a.id === b.id;
