// Docker platform deploy (`qpq go` with platform 'docker') — proof-of-concept
// self-hosting: bakes the QPQ dev server (a full local platform emulation)
// plus every service of the app and its pre-built views into one docker image.
//
//   1. Build workspace packages, then the dev-server bundle (all services).
//   2. Build every views microfrontend with a same-origin module-federation
//      remote base (/views/<svc>), mirroring the AWS website/views layout.
//   3. Assemble an image context under dist/qpq/docker-image/<app>/ — server
//      bundle, web root, a workspaces-stripped package.json for runtime deps,
//      and the locally-built quidproquo packages as a vendor overlay.
//   4. docker build, then print the run command.
//
// Not production-grade (single process, sqlite KVS, in-memory queues) —
// it's the whole product on one box with one command.
import { getQpqAppDeployment } from 'quidproquo-config-aws';
import { QpqDeployEnvVar } from 'quidproquo-core';
import { getAppServiceQpqConfigs, getDevServerRspackConfig } from 'quidproquo-deploy-rspack';

import fs from 'fs';
import path from 'path';

import { DeployPlan } from '../../lib/deployPrompts';
import { writeDevServerEntry } from '../../lib/devServerEntry';
import { getRoot, getServiceNamesWithViews } from '../../lib/discovery';
import { runAppHook } from '../../lib/hooks';
import { getOwnPackageRoot } from '../../lib/packageRoot';
import { runRspack } from '../../lib/rspackRun';
import { runCommand } from '../../lib/runCommand';
import { logTimeEnd, logTimeStart } from '../../lib/timing';
import { bundleViews, getViewsDistDir } from '../../lib/views';
import { getDockerPlatformSettings } from './getDockerPlatformSettings';

const getImageContextDir = (root: string, appName: string): string => path.join(root, 'dist', 'qpq', 'docker-image', appName);

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
  const { portMappings } = getDockerPlatformSettings(deploymentName, getQpqAppDeployment(root, appName, deploymentName));

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

  fs.copyFileSync(path.join(getOwnPackageRoot(), 'docker', 'dev-server', 'Dockerfile'), path.join(contextDir, 'Dockerfile'));
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

  // ---- Build the image ----
  console.log('Building docker image');
  await runCommand('docker', ['build', '-t', imageTag, contextDir]);

  logTimeEnd('totalTime');

  const sitePort = portMappings.find((mapping) => mapping.container === 8080)?.host;
  const portFlags = portMappings.map((mapping) => `-p ${mapping.host}:${mapping.container}`).join(' ');
  console.log(`
Done. The image is [${imageTag}] in the local docker store.

Run it here:

  docker run --rm ${portFlags} -v ${volumeName}:/app/.qpq-runtime ${imageTag}

Then open http://localhost${sitePort && sitePort !== 80 ? `:${sitePort}` : ''}

Or export it for another host (Unraid: upload the tarball, map the same ports and the /app/.qpq-runtime volume):

  docker save ${imageTag} | gzip > ${path.join(contextDir, `${imageTag.replace(':', '-')}.tar.gz`)}

(ports come from the deployment's platformSettings.portMappings: ${portMappings.map((m) => `${m.host}:${m.container}`).join(', ')})
`);
};
