/** One document to reproject: its doc type, its id, and the storage scope it lives under (absent for an unscoped one). */
export type EventDocReprojectTarget = {
  type: string;
  docId: string;
  scope?: string;
};
