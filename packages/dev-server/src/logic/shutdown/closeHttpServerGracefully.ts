import { Server } from 'http';

// server.close() stops accepting and then waits for every open connection to
// end, which on its own can be forever: a keep-alive socket an idle browser is
// holding, or a long-lived streamed response, never ends by itself. So: ask
// nicely, drop the idle sockets that are only holding the callback open, give
// the rest this long to finish, then cut them.
const SERVER_CLOSE_GRACE_MS = 1000;

/**
 * Stop an http server accepting new connections and let the in-flight ones
 * finish, without ever hanging on a socket that will not end.
 *
 * In-flight requests matter here beyond politeness: a request still running
 * when shutdown starts goes on to write, and StopAccepting runs before the
 * Persist phase precisely so those writes land.
 */
export const closeHttpServerGracefully = async (server: Server): Promise<void> => {
  const closed = new Promise<void>((resolve) => {
    server.close(() => resolve());
  });

  server.closeIdleConnections();

  const graced = new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), SERVER_CLOSE_GRACE_MS);

    void closed.then(() => {
      clearTimeout(timer);
      resolve(true);
    });
  });

  if (await graced) {
    return;
  }

  server.closeAllConnections();

  await closed;
};
