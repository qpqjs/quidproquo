/** Who authored an event being appended: a client through the routes, or trusted server code. */
export enum EventDocEventOrigin {
  client = 'client',
  server = 'server',
}
