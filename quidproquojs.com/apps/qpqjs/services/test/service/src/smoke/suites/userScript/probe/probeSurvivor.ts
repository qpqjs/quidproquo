import { connect } from 'node:net';

import { SmokeSurvivorProbeResult } from '../models/SmokeSurvivorProbeResult';

// Runs INSIDE the sandbox: tries the survivor port on loopback. A refused connection is the
// good outcome; anything that accepts is a process an earlier script call left behind.
export const probeSurvivor = (
  port: number
): Promise<SmokeSurvivorProbeResult> =>
  new Promise((resolve) => {
    const socket = connect({ port, host: '127.0.0.1' });
    const finish = (reachable: boolean, detail: string): void => {
      socket.destroy();
      resolve({ reachable, detail });
    };
    socket.setTimeout(1500, () => finish(false, 'connect timed out'));
    socket.on('connect', () => finish(true, 'connected'));
    socket.on('error', (error) => finish(false, error.message));
  });
