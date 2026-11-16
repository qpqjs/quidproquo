/** Where a reproject walk finds the documents a collection holds. */
export enum EventDocReprojectSource {
  // The lists store's summary rows: every document that has been projected. The usual source.
  Lists = 'lists',
  // The legacy summary store, for rebuilding a collection whose documents have no list view rows yet.
  // TODO: @joe-coady: remove this source when the legacy summary store is dropped from defineEventDocSummary.
  LegacySummary = 'legacySummary',
}
