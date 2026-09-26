// Docker platform deploy (`qpq go` with platform 'docker') — proof-of-concept
// self-hosting: bakes the QPQ dev server (a full local platform emulation)
// plus every service of the app and its pre-built views into one docker image.
//
//   1. Build workspace packages, then the dev-server bundle (all services).
//   2. Build every views microfrontend with a same-origin module-federation
//      remote base (/<views subdomain>/<svc>), mirroring the AWS layout.
//   3. Assemble an image context under dist/qpq/docker-image/<app>/ — server
//      bundle, web root (every web entry, placed by its port or its domain),
//      a workspaces-stripped package.json for runtime deps, and the
//      locally-built quidproquo packages as a vendor overlay.
//   4. docker build (buildx with a push when the deployment names a registry or
//      a target platform), write a docker-compose.yml, print how to run it.
//
// Not production-grade (single process, sqlite KVS, in-memory queues) —
// it's the whole product on one box with one command.
import { getQpqAppDeployment } from 'quidproquo-config-aws';
import { QpqDeployEnvVar } from 'quidproquo-core';
import { getAppServiceQpqConfigs, getDevServerRspackConfig } from 'quidproquo-deploy-rspack';
import { getWebEntryDir, getWebEntryPlacements, WebEntryHost, WebEntryRoute } from 'quidproquo-dev-server';
import { FEDERATED_VIEWS_SUBDOMAIN } from 'quidproquo-webserver';

import fs from 'fs';
import path from 'path';

import { DeployPlan } from '../../lib/deployPrompts';
import { writeDevServerEntry } from '../../lib/devServerEntry';
import { readDevServerPorts } from '../../lib/devServerPorts';
import { getRoot, getServiceNamesWithViews } from '../../lib/discovery';
import { runAppHook } from '../../lib/hooks';
import { getOwnPackageRoot } from '../../lib/packageRoot';
import { runRspack } from '../../lib/rspackRun';
import { runCommand } from '../../lib/runCommand';
import { logTimeEnd, logTimeStart } from '../../lib/timing';
import { bundleViews, getViewsDistDir } from '../../lib/views';
import { clearWebAddressingEnv, setWebAddressingEnv } from '../../lib/webAddressingEnv';
import { getContainerPorts } from './getContainerPorts';
import { getDockerPlatformSettings, ParsedDockerPlatformSettings } from './getDockerPlatformSettings';
import { getImageName } from './getImageName';
import { resolvePortMappings } from './resolvePortMappings';
import { writeComposeFile } from './writeComposeFile';

const getImageContextDir = (root: string, appName: string): string => path.join(root, 'dist', 'qpq', 'docker-image', appName);

// Every web entry's files go where the runtime looks for them. The federated views entry
// is assembled from every service's views build (one folder per service, as on AWS);
// anything else is its own buildPath. A missing build fails here rather than serving an
// empty site later.
const copyWebEntryContent = (appName: string, contextDir: string, entry: WebEntryHost | WebEntryRoute, viewServices: string[]): void => {
  const label = `${entry.service}/${entry.entryName}`;
  const targetDir = getWebEntryDir(path.join(contextDir, 'web'), entry);

  if (entry.webEntry.domain.subDomainName === FEDERATED_VIEWS_SUBDOMAIN) {
    for (const serviceName of viewServices) {
      fs.cpSync(getViewsDistDir(appName, serviceName), path.join(targetDir, serviceName), { recursive: true });
    }
    return;
  }

  if (!entry.webEntry.buildPath) {
    throw new Error(`Web entry ${label} has no buildPath, so there is nothing to serve`);
  }
  const buildDir = path.resolve(entry.configRoot, entry.webEntry.buildPath);
  if (!fs.existsSync(path.join(buildDir, entry.webEntry.indexRoot))) {
    throw new Error(`Web entry ${label} has no ${entry.webEntry.indexRoot} under ${buildDir}; build it before qpq go`);
  }
  fs.cpSync(buildDir, targetDir, { recursive: true });
};

// Plain `docker build` into the local store unless the deployment asks for a registry or a
// target platform, which need buildx: `--push` sends a cross-platform image straight to the
// registry, `--load` keeps a same-machine one local.
const buildImage = async (imageName: string, contextDir: string, settings: ParsedDockerPlatformSettings): Promise<void> => {
  if (!settings.registry && !settings.arch) {
    await runCommand('docker', ['build', '-t', imageName, contextDir]);
    return;
  }

  const platformArgs = settings.arch ? ['--platform', settings.arch] : [];
  await runCommand('docker', ['buildx', 'build', ...platformArgs, '-t', imageName, settings.registry ? '--push' : '--load', contextDir]);
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

  const applicationName = process.env[QpqDeployEnvVar.applicationName]!;
  const imageName = getImageName(applicationName, dockerSettings);
  const containerName = `qpq-${applicationName}`;
  const volumeName = `${containerName}-data`;

  // The dev server hosts every service of the app, so per-service/stack
  // selections don't apply — the image is always the whole app.
  console.log(`\n\nBuilding docker image [${imageName}] — the whole app deploys as one image\n\n`);

  logTimeStart('totalTime');

  await runAppHook(appName, 'predeploy');

  // Workspace packages resolve through their built dist/ (package.json main),
  // so bundles would ship stale code unless every lib is tsc'd first.
  console.log('Building workspace packages');
  await runCommand('npm', ['run', 'build', '--workspaces', '--if-present']);

  // ---- Server bundle: the dev server + every service, one main.js ----
  console.log('Bundling server (dev server + all services)');
  const qpqConfigs = getAppServiceQpqConfigs(root, appName);

  // Resolved before anything slow runs, so a bad port or domain fails the build up front.
  const devServerPorts = readDevServerPorts(appName);
  const { hosts: webEntryHosts, routes: webEntryRoutes } = getWebEntryPlacements(qpqConfigs, Object.values(devServerPorts));
  const containerPorts = getContainerPorts(devServerPorts, webEntryHosts);
  const portMappings = resolvePortMappings(deploymentName, dockerSettings, devServerPorts.api, containerPorts);
  const mapHostPort = (containerPort: number): number => portMappings.find((mapping) => mapping.container === containerPort)?.host ?? containerPort;

  // Nothing deploys into the container, so the image runs its own pending migrations on start.
  const entry = writeDevServerEntry(root, appName, 'migrate-then-serve');
  // The image installs its own node_modules next to the bundle, so externals
  // must stay bare; host-resolved absolute paths do not exist in the container.
  await runRspack(getDevServerRspackConfig({ root, entry, qpqConfigs, portableExternals: true }));

  // ---- Views: production builds with same-origin federation remotes ----
  // The browser reaches everything on the page's own host, on the HOST side of the port
  // mappings; an unmapped port stays as is (nothing outside the container can reach it anyway).
  setWebAddressingEnv(qpqConfigs, { api: devServerPorts.api, webSocket: devServerPorts.webSocket, mapHostPort });
  process.env.QPQ_VIEWS_REMOTE_BASE = `/${FEDERATED_VIEWS_SUBDOMAIN}`;
  const viewServices = getServiceNamesWithViews(appName);
  for (const serviceName of viewServices) {
    console.log(`Bundling views: [${serviceName}]`);
    await bundleViews(appName, serviceName);
  }
  delete process.env.QPQ_VIEWS_REMOTE_BASE;
  clearWebAddressingEnv();

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

  for (const entry of [...webEntryRoutes, ...webEntryHosts]) {
    copyWebEntryContent(appName, contextDir, entry, viewServices);
  }

  const composePath = writeComposeFile({
    contextDir,
    imageName,
    serviceName: containerName,
    volumeName,
    portMappings,
    dataPath: dockerSettings.dataPath ?? null,
    publicHost: dockerSettings.publicHost ?? null,
    publicFileStoragePort: mapHostPort(devServerPorts.fileStorage),
  });

  // ---- Build the image ----
  console.log(
    `Building docker image${dockerSettings.arch ? ` for ${dockerSettings.arch}` : ''}${dockerSettings.registry ? `, pushing to ${dockerSettings.registry}` : ''}`,
  );
  await buildImage(imageName, contextDir, dockerSettings);

  logTimeEnd('totalTime');

  const hostUrl = (containerPort: number): string => {
    const hostPort = portMappings.find((mapping) => mapping.container === containerPort)?.host;
    return hostPort === undefined ? `(container port ${containerPort} is not mapped)` : `http://localhost${hostPort === 80 ? '' : `:${hostPort}`}`;
  };
  const siteUrl = hostUrl(devServerPorts.api);
  const entryLines = [
    ...webEntryRoutes.map((route) => `  ${route.service}/${route.entryName}: ${siteUrl}${route.path === '/' ? '' : route.path}`),
    ...webEntryHosts.map((host) => `  ${host.service}/${host.entryName}: ${hostUrl(host.port)}`),
  ].join('\n');
  const where = dockerSettings.registry ? `pushed to [${imageName}]` : `[${imageName}] in the local docker store`;
  const onHost = dockerSettings.registry
    ? `On the host (Unraid: Compose Manager, or any docker host), copy the compose file there and run:`
    : `Run it here:`;
  console.log(`
Done. The image is ${where}.

${onHost}

  docker compose -f ${composePath} up -d

Then open ${siteUrl} (replace localhost with the host's address)
${entryLines ? `\nWeb entries:\n${entryLines}\n` : ''}
Ports come from the deployment's platformSettings.portMappings (${portMappings.map((m) => `${m.host}:${m.container}`).join(', ')})
and are baked into the frontend, so a host must map the same ones. App state lives in ${dockerSettings.dataPath ?? `the ${volumeName} volume`}.${
    dockerSettings.publicHost
      ? ''
      : `\nSecure file urls point at localhost; set platformSettings.publicHost to the address browsers use for this host.`
  }
`);
};
