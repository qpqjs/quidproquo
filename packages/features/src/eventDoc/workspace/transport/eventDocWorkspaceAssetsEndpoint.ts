import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';

/** Asset upload route path, as defineEventDocRoutes registers it. */
export const eventDocWorkspaceAssetsEndpoint = ({ basePath, id }: EventDocWorkspaceDocumentIdentity): string => `/v1${basePath}/${id}/assets`;
