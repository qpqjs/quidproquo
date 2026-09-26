// Docker platform deploy (`qpq go` with platform 'docker') — proof-of-concept
// self-hosting: bakes the QPQ dev server (a full local platform emulation)
// plus every service of the app and its pre-built views into one docker image.
//
//   1. Build workspace packages, then the dev-server bundle (all services).
//   2. Build every views microfrontend with a same-origin module-federation
//      remote base (/views/<svc>), mirroring the AWS website/views layout.
//   3. Assemble an image context under dist/qpq/docker-image/<app>/ — server
//      bundle, web root (views plus every other web entry given a port, each
//      hosted on that port), a workspaces-stripped package.json for runtime
//      deps, and the locally-built quidproquo packages as a vendor overlay.
//   4. docker build, then print the run command.
//
// Not production-grade (single process, sqlite KVS, in-memory queues) —
// it's the whole product on one box with one command.
import { getQpqAppDeployment } from 'quidproquo-config-aws';
import { QPQConfig, qpqCoreUtils, QpqDeployEnvVar } from 'quidproquo-core';
import { getAppServiceQpqConfigs, getDevServerRspackConfig } from 'quidproquo-deploy-rspack';
import { getWebEntryHostDir, getWebEntryHosts, WebEntryHost } from 'quidproquo-dev-server';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import fs from 'fs';
import path from 'path';

import { DeployPlan } from '../../lib/deployPrompts';
import { writeDevServerEntry } from '../../lib/devServerEntry';
import { DEV_SERVER_PORTS } from '../../lib/devServerPorts';
import { getRoot, getServiceNamesWithViews } from '../../lib/discovery';
import { runAppHook } from '../../lib/hooks';
import { getOwnPackageRoot } from '../../lib/packageRoot';
import { runRspack } from '../../lib/rspackRun';
import { runCommand } from '../../lib/runCommand';
import { logTimeEnd, logTimeStart } from '../../lib/timing';
import { bundleViews, getViewsDistDir } from '../../lib/views';
import { BASE_CONTAINER_PORTS, getContainerPorts } from './getContainerPorts';
import { getDockerPlatformSettings } from './getDockerPlatformSettings';
import { resolvePortMappings } from './resolvePortMappings';

const getImageContextDir = (root: string, appName: string): string => path.join(root, 'dist', 'qpq', 'docker-image', appName);

// The shell's website and views entries are served same-origin on the api port by
// convention; anything else only reaches the image through a defineDevServerOptions port.
const SAME_ORIGIN_WEB_ENTRIES = ['website', 'views'];

const listUnhostedWebEntries = (qpqConfigs: QPQConfig[], hosts: WebEntryHost[]): string[] =>
  qpqConfigs.flatMap((qpqConfig) => {
    const service = qpqCoreUtils.getApplicationModuleName(qpqConfig);
    return qpqWebServerUtils
      .getWebEntryConfigs(qpqConfig)
      .filter((entry) => !SAME_ORIGIN_WEB_ENTRIES.includes(entry.name))
      .filter((entry) => !hosts.some((host) => host.service === service && host.entryName === entry.name))
      .map((entry) => `${service}/${entry.name}`);
  });

// Each hosted entry's build output goes where the runtime looks for it. A missing build is
// an error here rather than an empty site later: the entry asked to be hosted.
const copyWebEntryHosts = (contextDir: string, hosts: WebEntryHost[]): void => {
  for (const host of hosts) {
    if (!host.webEntry.buildPath) {
      throw new Error(`Web entry ${host.service}/${host.entryName} has a port but no buildPath, so there is nothing to host`);
    }
    const buildDir = path.resolve(host.configRoot, host.webEntry.buildPath);
    if (!fs.existsSync(path.join(buildDir, host.webEntry.indexRoot))) {
      throw new Error(`Web entry ${host.service}/${host.entryName} has no ${host.webEntry.indexRoot} under ${buildDir}; build it before qpq go`);
    }
    fs.cpSync(buildDir, getWebEntryHostDir(path.join(contextDir, 'web'), host), { recursive: true });
  }
};

// The Dockerfile is shared; only its EXPOSE line depends on the app.
const writeDockerfile = (contextDir: string, containerPorts: number[]): void => {
  const template = fs.readFileSync(path.join(getOwnPackageRoot(), 'docker', 'dev-server', 'Dockerfile'), 'utf8');
  const dockerfile = template.replace(/^EXPOSE .*$/m, `EXPOSE ${containerPorts.join(' ')}`);
  fs.writeFileSync(path.join(contextDir, 'Dockerfile'), dockerfile);
};

// The consumer root package.json, stripped to what the image's npm install
// needs: runtime dependencies (+ overrides). Workspaces/scripts/devDeps are
// host-only concerns — the workspace packages themselves are bundled into the
// server bundle from source.
//
// quidproquo deps declared as file: refs (a consumer living beside the qpq
// monorepo) point outside the image context, where npm install would leave
// dangling symlinks — rewrite them to the vendored copies inside the context.
const writeImagePackageJson = (root: string, contextDir: string): void => {
  const rootPackageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  const dependencies: Record<string, string> = { ...(rootPackageJson.dependencies ?? {}) };
  for (const [name, version] of Object.entries(dependencies)) {
    if (name.startsWith('quidproquo') && version.startsWith('file:')) {
      dependencies[name] = `file:./vendor/${name}`;
    }
  }

  const imagePackageJson = {
    name: `${rootPackageJson.name}-qpq-docker`,
    version: rootPackageJson.version ?? '0.0.0',
    private: true,
    dependencies,
    overrides: rootPackageJson.overrides,
  };

  fs.writeFileSync(path.join(contextDir, 'package.json'), JSON.stringify(imagePackageJson, null, 2) + '\n');
};

// Copy the locally-built quidproquo packages (which may be npm-linked
// checkouts newer than the registry) into vendor/ so the image runs the same
// qpq code the bundle was built against. Follows the node_modules symlinks;
// lib/config only — no node_modules, no src.
const vendorQuidproquoPackages = (root: string, contextDir: string): number => {
  const nodeModules = path.join(root, 'node_modules');
  const vendorDir = path.join(contextDir, 'vendor');
  let vendored = 0;

  for (const name of fs.readdirSync(nodeModules)) {
    if (!name.startsWith('quidproquo')) continue;

    const packageDir = fs.realpathSync(path.join(nodeModules, name));
    const targetDir = path.join(vendorDir, name);
    fs.mkdirSync(targetDir, { recursive: true });

    fs.copyFileSync(path.join(packageDir, 'package.json'), path.join(targetDir, 'package.json'));
    for (const sub of ['lib', 'config']) {
      const subDir = path.join(packageDir, sub);
      if (fs.existsSync(subDir)) {
        fs.cpSync(subDir, path.join(targetDir, sub), { recursive: true, dereference: true });
      }
    }
    vendored += 1;
  }

  return vendored;
};

export const dockerGo = async (appName: string, plan: DeployPlan): Promise<void> => {
  if (plan.kind === 'cancelled') {
    return;
  }

  if (plan.kind === 'account' || plan.kind === 'bootstrap') {
    console.log(`Nothing to do — the docker platform has no ${plan.kind} stacks.`);
    return;
  }

  const root = getRoot();
  const deploymentName = process.env[QpqDeployEnvVar.deployName]!;
  const dockerSettings = getDockerPlatformSettings(deploymentName, getQpqAppDeployment(root, appName, deploymentName));

  // Tagged by the deployment's name, not the app folder, so two products built
  // from one codebase get separate images and data volumes.
  const applicationName = process.env[QpqDeployEnvVar.applicationName];
  const imageTag = `qpq-${applicationName}:${process.env[QpqDeployEnvVar.environment]}`;
  const volumeName = `qpq-${applicationName}-data`;

  // The dev server hosts every service of the app, so per-service/stack
  // selections don't apply — the image is always the whole app.
  console.log(`\n\nBuilding docker image [${imageTag}] — the whole app deploys as one image\n\n`);

  logTimeStart('totalTime');

  await runAppHook(appName, 'predeploy');

  // Workspace packages resolve through their built dist/ (package.json main),
  // so bundles would ship stale code unless every lib is tsc'd first.
  console.log('Building workspace packages');
  await runCommand('npm', ['run', 'build', '--workspaces', '--if-present']);

  // ---- Server bundle: the dev server + every service, one main.js ----
  console.log('Bundling server (dev server + all services)');
  const qpqConfigs = getAppServiceQpqConfigs(root, appName);

  // Resolved before anything slow runs, so a bad port fails the build up front.
  const webEntryHosts = getWebEntryHosts(qpqConfigs, BASE_CONTAINER_PORTS);
  const containerPorts = getContainerPorts(webEntryHosts);
  const portMappings = resolvePortMappings(deploymentName, dockerSettings, containerPorts);
  for (const unhosted of listUnhostedWebEntries(qpqConfigs, webEntryHosts)) {
    console.warn(`Web entry ${unhosted} has no port in defineDevServerOptions({ webEntries }) and will not be in the image`);
  }

  const entry = writeDevServerEntry(root, appName);
  // The image installs its own node_modules next to the bundle, so externals
  // must stay bare; host-resolved absolute paths do not exist in the container.
  await runRspack(getDevServerRspackConfig({ root, entry, qpqConfigs, portableExternals: true }));

  // ---- Views: production builds with same-origin federation remotes ----
  process.env.QPQ_VIEWS_REMOTE_BASE = '/views';
  const viewServices = getServiceNamesWithViews(appName);
  for (const serviceName of viewServices) {
    console.log(`Bundling views: [${serviceName}]`);
    await bundleViews(appName, serviceName);
  }
  delete process.env.QPQ_VIEWS_REMOTE_BASE;

  // ---- Assemble the image context ----
  console.log('Assembling image context');
  const contextDir = getImageContextDir(root, appName);
  fs.rmSync(contextDir, { recursive: true, force: true });
  fs.mkdirSync(contextDir, { recursive: true });

  writeDockerfile(contextDir, containerPorts);
  writeImagePackageJson(root, contextDir);

  const vendored = vendorQuidproquoPackages(root, contextDir);
  console.log(`Vendored ${vendored} quidproquo packages`);

  fs.cpSync(path.join(root, 'dist', 'qpq', 'dev-server'), path.join(contextDir, 'server'), { recursive: true });

  // Web root mirrors the AWS buckets: shell at website/, every views build
  // (shell included) under views/<svc>/.
  for (const serviceName of viewServices) {
    const viewsDist = getViewsDistDir(appName, serviceName);
    fs.cpSync(viewsDist, path.join(contextDir, 'web', 'views', serviceName), { recursive: true });
    if (serviceName === 'shell') {
      fs.cpSync(viewsDist, path.join(contextDir, 'web', 'website'), { recursive: true });
    }
  }

  copyWebEntryHosts(contextDir, webEntryHosts);

  // ---- Build the image ----
  console.log('Building docker image');
  await runCommand('docker', ['build', '-t', imageTag, contextDir]);

  logTimeEnd('totalTime');

  const hostUrl = (containerPort: number): string => {
    const hostPort = portMappings.find((mapping) => mapping.container === containerPort)?.host;
    return hostPort === undefined ? `(container port ${containerPort} is not mapped)` : `http://localhost${hostPort === 80 ? '' : `:${hostPort}`}`;
  };
  const portFlags = portMappings.map((mapping) => `-p ${mapping.host}:${mapping.container}`).join(' ');
  const entryLines = webEntryHosts.map((host) => `  ${host.service}/${host.entryName}: ${hostUrl(host.port)}`).join('\n');
  console.log(`
Done. The image is [${imageTag}] in the local docker store.

Run it here:

  docker run --rm ${portFlags} -v ${volumeName}:/app/.qpq-runtime ${imageTag}

Then open ${hostUrl(DEV_SERVER_PORTS.api)}
${entryLines ? `\nOther web entries:\n${entryLines}\n` : ''}
Or export it for another host (Unraid: upload the tarball, map the same ports and the /app/.qpq-runtime volume):

  docker save ${imageTag} | gzip > ${path.join(contextDir, `${imageTag.replace(':', '-')}.tar.gz`)}

(ports come from the deployment's platformSettings.portMappings: ${portMappings.map((m) => `${m.host}:${m.container}`).join(', ')})
`);
};
