import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';

/** Asset download route path, as defineEventDocRoutes registers it. */
export const eventDocWorkspaceAssetDownloadEndpoint = ({ basePath, id }: EventDocWorkspaceDocumentIdentity, assetId: string): string =>
  `/v1${basePath}/${id}/assets/${assetId}`;
