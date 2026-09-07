/** Which collection and document a slot is bound to; event routes live at `/v1{basePath}/{id}/events` on `serviceName`. */
export type EventDocWorkspaceDocumentIdentity = {
  serviceName: string;
  basePath: string;
  id: string;
};
