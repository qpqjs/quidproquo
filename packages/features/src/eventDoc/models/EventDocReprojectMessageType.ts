/** The messages a collection's reproject queue handles. */
export enum EventDocReprojectMessageType {
  // Scan one page of the collection for documents, queue each, then queue the next page.
  Walk = 'qpq/eventDoc/reproject/Walk',
  // Re-run the projector at one document's head.
  Document = 'qpq/eventDoc/reproject/Document',
}
