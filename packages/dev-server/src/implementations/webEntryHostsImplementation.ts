import express from 'express';
import fs from 'fs';
import { Server } from 'http';
import path from 'path';

import { getWebEntryDir, getWebEntryPlacements, WebEntryHost } from '../config/webEntryHosts';
import { closeHttpServerGracefully } from '../logic';
import { DevServerPluginStop } from '../plugins/types/DevServerPluginStop';
import { ResolvedDevServerConfig } from '../types';

const startHost = (host: WebEntryHost, dir: string): Server => {
  const app = express();

  app.use(express.static(dir));

  // SPA fallback, the same as the site root: client-side routes resolve to the entry's index.
  app.get('*', (req, res) => {
    if (req.accepts('html')) {
      res.sendFile(path.join(dir, host.webEntry.indexRoot));
    } else {
      res.status(404).send({ message: 'resource does not exist' });
    }
  });

  return app.listen(host.port, '0.0.0.0', () => {
    console.log(`[Qpq - Dev Server]: web entry ${host.service}/${host.entryName} is running at [http://localhost:${host.port}]`);
  });
};

/**
 * Hosts every web entry that has a port, each on its own listener, from the pre-built web root.
 * An entry whose files are missing from the image is reported and skipped rather than served empty.
 */
export const webEntryHostsImplementation = async (devServerConfig: ResolvedDevServerConfig): Promise<DevServerPluginStop | null> => {
  const { webRoot } = devServerConfig;
  if (!webRoot) {
    return null;
  }

  const reservedPorts = [devServerConfig.serverPort, devServerConfig.webSocketPort, devServerConfig.fileStorageConfig.secureUrlPort].filter(
    (port): port is number => port !== undefined,
  );
  const { hosts } = getWebEntryPlacements(devServerConfig.qpqConfigs, reservedPorts);

  const servers: Server[] = [];
  for (const host of hosts) {
    const dir = getWebEntryDir(webRoot, host);
    if (!fs.existsSync(path.join(dir, host.webEntry.indexRoot))) {
      console.warn(`[Qpq - Dev Server]: web entry ${host.service}/${host.entryName} has no ${host.webEntry.indexRoot} under ${dir}, not hosting it`);
      continue;
    }

    servers.push(startHost(host, dir));
  }

  return async () => {
    await Promise.all(servers.map(closeHttpServerGracefully));
  };
};
