import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';

/** Events route path, as defineEventDocRoutes registers it. */
export const eventDocWorkspaceEventsEndpoint = ({ basePath, id }: EventDocWorkspaceDocumentIdentity): string => `/v1${basePath}/${id}/events`;
