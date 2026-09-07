/** Supplied by the host when it initialises a list instance. The edit* fields are opaque routing strings the host reads back. */
export type EventDocListConfig = {
  serviceName: string;
  basePath: string;
  editService: string;
  editModule: string;
  // Labels the editor as `{entityLabel} - {name}`.
  entityLabel: string;
  // Base path the editor is opened against when doc CRUD lives elsewhere than the create route. Empty means basePath.
  editBasePath: string;
  // Base path the summary list is fetched from when it differs from the create route. Empty means basePath.
  listBasePath: string;
  // Whether the collection's service mounts defineEventDocTransfer; Export/Import would 404 otherwise.
  canTransfer: boolean;
};
