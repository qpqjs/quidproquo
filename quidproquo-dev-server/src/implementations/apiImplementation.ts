import { askProcessEvent, QPQConfig, qpqCoreUtils, qpqExecuteLog, QpqFunctionRuntime, QpqRuntimeType, StoryResult } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import bodyParser from 'body-parser';
import express, { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';

import { getExpressApiEventEventProcessor } from '../actionProcessor';
import { getAllServiceConfigs } from '../allServiceConfig';
import { closeHttpServerGracefully, isDevServerReady, processEvent } from '../logic';
import { DevServerPluginStop } from '../plugins/types/DevServerPluginStop';
import { ExpressEvent, ExpressEventResponse, ResolvedDevServerConfig } from '../types';

const getServiceBaseDomain = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig) =>
  qpqWebServerUtils.getDomainRoot(
    `${devServerConfig.serverDomain}:${devServerConfig.serverPort}`,
    qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
    qpqCoreUtils.getApplicationModuleFeature(qpqConfig),
  );

// Raw string bodies pass through verbatim. Multer leaves multipart fields as an object, which
// is re-serialised. body-parser sets `{}` when there was no body at all, where production
// delivers undefined, so an empty object is undefined here too.
const toEventBody = (req: Request): string | undefined => {
  if (typeof req.body === 'string') {
    return req.body;
  }

  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return JSON.stringify(req.body);
  }

  return undefined;
};

const getApiDomainsFromConfig = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig) => {
  const baseDomain = getServiceBaseDomain(qpqConfig, devServerConfig);

  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);

  // Get apis
  const apiConfigs = qpqWebServerUtils.getApiConfigs(qpqConfig);

  const apiDomains = apiConfigs.map((apiConfig) => ({
    apiName: apiConfig.apiName,
    service: serviceName,
    qpqConfig,
    domain: `${apiConfig.apiSubdomain}.${baseDomain}`,
    devDomain: baseDomain,
    devPath: `/${apiConfig.apiSubdomain}/${serviceName}`,
  }));

  return apiDomains;
};

// The admin routes are called from the admin frontend, which is served from
// this same server but reached on whatever host the developer typed. Wide open
// on purpose: this is a local tool, and nothing here is reachable off the box.
const allowAnyOrigin = (res: Response): void => {
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'false');
};

const getDynamicModuleLoader = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig) => {
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);
  return async (runtime: QpqFunctionRuntime): Promise<any> => devServerConfig.dynamicModuleLoader(serviceName, runtime);
};

export const apiImplementation = async (devServerConfig: ResolvedDevServerConfig): Promise<DevServerPluginStop> => {
  const allServiceConfig = getAllServiceConfigs(devServerConfig);

  const app: Express = express();

  app.use(multer().any());

  // Service requests keep their json and form-urlencoded bodies as the raw string, exactly as
  // API Gateway delivers them, so a route parses (and rejects) its own body on the same code
  // path as production. Parsing here would re-serialise the body below (see `toEventBody`)
  // and turn malformed json into an express html error before the story ever runs. The admin
  // endpoints are not service requests and still parse theirs with express.json().
  const rawServiceBody = bodyParser.text({ type: ['application/json', 'application/x-www-form-urlencoded'], limit: '50mb' });
  app.use((req, res, next) => (req.path.startsWith('/admin') ? next() : rawServiceBody(req, res, next)));

  const apiConfigs = allServiceConfig.map((qpqConfig) => getApiDomainsFromConfig(qpqConfig, devServerConfig)).flat();

  console.log(apiConfigs.map((ac) => ac.devPath));

  // Resolved through node resolution (not a __dirname walk) so it works both
  // from a workspace checkout and inside the docker platform image.
  const adminFrontend = path.join(path.dirname(require.resolve('quidproquo-web-admin/package.json')), 'lib');

  // Admin page
  app.use('/admin', express.static(adminFrontend));

  // Readiness, for anything that has to wait for the dev server before it can
  // do useful work: a CI script about to POST, a docker HEALTHCHECK.
  //
  // 503 until every plugin has started, not just this one. This route answers
  // as soon as the port is bound, which is exactly the window the caller needs
  // told about - a TCP connect would say "up" here and be wrong.
  app.get('/admin/service/ready', (req, res) => {
    const ready = isDevServerReady();

    res.status(ready ? 200 : 503).json({ ready });
  });

  app.get('/admin/service/log/list', (req, res) => {
    allowAnyOrigin(res);

    const serviceList = allServiceConfig.map((qpqConfig) => qpqCoreUtils.getApplicationModuleName(qpqConfig)).map((name) => `api/${name}`);

    res.json(serviceList);
  });

  app.use(express.json());

  app.options('/admin/service/log/execute', async (req, res) => {
    allowAnyOrigin(res);

    res.json({ done: true });
  });

  app.get('/mf-manifest-location.json', async (req, res) => {
    allowAnyOrigin(res);

    res.json({ location: 'http://localhost:3005/mf-manifest.json' });
  });

  app.post('/admin/service/log/execute', async (req, res) => {
    allowAnyOrigin(res);

    // TODO: Get list of services from config dynamically
    const serviceLog: StoryResult<any> = req.body;

    let runtimeModule = serviceLog.qpqFunctionRuntimeInfo
      ? await devServerConfig.dynamicModuleLoader(serviceLog.moduleName, serviceLog.qpqFunctionRuntimeInfo)
      : askProcessEvent;

    const result = await qpqExecuteLog(serviceLog, runtimeModule);
    res.json(result);
  });

  // Pre-built views (docker platform image): shell at /, remotes at
  // /views/<svc> — the same layout as the AWS website/views buckets, so the
  // module-federation manifests resolve with a root-relative remote base.
  if (devServerConfig.webRoot) {
    app.use('/views', express.static(path.join(devServerConfig.webRoot, 'views')));
    app.use(express.static(path.join(devServerConfig.webRoot, 'website')));
  }

  // Proxy for all services
  app.all('*', async (req: Request | any, res: Response) => {
    const apiConfig = apiConfigs.find((c) => req.url.startsWith(`${c.devPath}/`));

    if (apiConfig) {
      console.log(`[${req.method}::${req.socket.remoteAddress}]: ${req.protocol}://${req.get('host')}${req.url}`);

      const event: ExpressEvent = {
        protocol: req.protocol,
        host: req.get('host') || devServerConfig.serverDomain,
        path: req.url.substring(apiConfig.devPath.length).split('?')[0],
        ip: req.socket.remoteAddress || '127.0.0.1',
        query: req.query as { [key: string]: undefined | string | string[] },
        correlation: '',

        headers: req.headers as {
          [key: string]: undefined | string;
        },
        method: req.method,
        isBase64Encoded: false,
        body: toEventBody(req),
      };

      if (req.files) {
        event.files = req.files.map((file: any) => ({
          base64Data: file.buffer.toString('base64'),
          filename: file.originalname,
          mimetype: file.mimetype,
        }));
      }

      const response = await processEvent<ExpressEvent, ExpressEventResponse>(
        event,
        apiConfig.qpqConfig,
        getDynamicModuleLoader(apiConfig.qpqConfig, devServerConfig),
        getExpressApiEventEventProcessor,
        QpqRuntimeType.API,
        () => ({
          depth: 0,
          context: {},
        }),
        devServerConfig,
      );

      if (response.result) {
        for (const [header, value] of Object.entries(response.result.headers)) {
          res.set(header, value);
        }

        if (response.result.isBase64Encoded) {
          res.status(response.result.statusCode).send(Buffer.from(response.result.body, 'base64'));
        } else {
          res.status(response.result.statusCode).send(response.result.body);
        }
      }
    } else if (devServerConfig.webRoot && req.method === 'GET' && req.accepts('html')) {
      // SPA fallback — client-side routes resolve to the shell's index.html.
      res.sendFile(path.resolve(devServerConfig.webRoot, 'website', 'index.html'));
    } else {
      console.log(`NotFound::[${req.method}::${req.socket.remoteAddress}]: ${req.protocol}://${req.get('host')}${req.url}`);
      res.status(500).send({ message: 'resource does not exist' });
    }
  });

  const httpServer = app.listen(devServerConfig.serverPort, '0.0.0.0', () => {
    const baseDomain = getServiceBaseDomain(allServiceConfig[0], devServerConfig);

    console.log(`⚡️⚡️⚡️[Qpq - Dev Server]⚡️⚡️⚡️: Server is running at [http://${baseDomain}]`);
  });

  // A request still running when shutdown starts gets to finish, and whatever
  // it writes is still ahead of the Persist phase.
  return () => closeHttpServerGracefully(httpServer);
};
