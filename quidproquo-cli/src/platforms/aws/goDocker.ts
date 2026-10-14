// `qpq go:docker` — asks the same questions as `qpq go`, then builds locally
// and deploys in parallel via docker. The two halves can run on different
// machines, which is what lets a CI deploy run one job per service and phase:
//
//   qpq go:docker <svc> <stack>                build, then deploy
//   qpq go:docker <svc> <stack> --build-only   build and save; no docker needed
//   qpq go:docker <svc> <stack> --from-build   deploy the saved build; the
//                                              workspace need not be built
//
// The build half: QPQ config synth, rspack api bundles, rspack view bundles,
// rspack federated-remote bundles, and one self-contained CDK cloud assembly
// per service (`cdk synth --output`, which stages the api bundle as assets).
// It ends by writing a manifest per service with everything the deploy half
// needs that only the live config can answer (stack names, views destinations,
// the federated store), so the deploy half never loads a service config. The
// saved build for a service is:
//   dist/qpq/go-docker/<app>/<svc>/assembly                  the cloud assembly
//   dist/qpq/go-docker/<app>/<svc>/deploy.json               the manifest
//   dist/apps/<app>/services/<svc>/views                     the views bundle
//   dist/apps/<app>/services/<svc>/service-remote-published  the federated remote
//
// The deploy half, from the manifests:
//   wave 1 (inf): one docker container per service deploys its inf stack, all
//     concurrently. Containers run only the CDK CLI against the mounted
//     assembly — the workspace (and its npm-linked quidproquo packages) never
//     needs to exist inside the image.
//   wave 2 (api + web): once every inf stack is done, api and web stacks for
//     all services deploy concurrently (they depend only on inf, not on each
//     other).
//   views: the built bundles are synced to S3, one aws-cli container per
//     service, all concurrently.
//   publish: the built federated remotes (backends that opt in with
//     defineFederatedModuleStore(...)) are synced to S3 and their manifests
//     flipped, one aws-cli container per service, all concurrently. Follows
//     every api deploy, so a lambda never runs a previous release's stories.
//
// domain/bootstrap menu options deploy host-side exactly like `qpq go` —
// a single stack gains nothing from docker.
//
// Requires the same env as `go` (the build half included: `cdk synth` still
// looks up hosted zones and VPCs) plus a running docker daemon for the deploy
// half. Knobs: GO_DOCKER_BUILD_CONCURRENCY (default: the machine's core count —
// local builds are CPU-bound) and GO_DOCKER_DEPLOY_CONCURRENCY (default
// unlimited — deploys just wait on CloudFormation).
import { QpqDeployEnvVar } from 'quidproquo-core';
import { qpqDeployAwsCdkUtils } from 'quidproquo-deploy-awscdk';
import { getServiceRspackConfig } from 'quidproquo-deploy-rspack';

import fs from 'fs';
import os from 'os';
import path from 'path';

import { synthCommand } from '../../commands/synth';
import { DeployPlan, StackType } from '../../lib/deployPrompts';
import { getRoot, getServiceDirectory, getServiceNamesWithViews } from '../../lib/discovery';
import { GoDockerMode } from '../../lib/goDockerMode';
import { runAppHook } from '../../lib/hooks';
import { getServiceNamesWithFederation, loadServiceQpqConfig } from '../../lib/qpqConfigs';
import { runRspack } from '../../lib/rspackRun';
import { nextPrefixColor, runCommand, runCommandBestEffort, runCommandPrefixed } from '../../lib/runCommand';
import { assertNoFailures, runTasks } from '../../lib/runTasks';
import { logTimeEnd, logTimeStart } from '../../lib/timing';
import { bundleViews, getViewsDistDir } from '../../lib/views';
import { isAwsCredentialsValid } from './awsCredentials';
import { getCdkAppCommand, getCdkCliVersion, getDockerDir } from './cdkApp';
import {
  fromManifestPath,
  getGoDockerAssemblyDir,
  getGoDockerBuildDir,
  GoDockerBuildManifest,
  GoDockerRemoteEntry,
  GoDockerViewsEntry,
  readGoDockerBuildManifest,
  toManifestPath,
  writeGoDockerBuildManifest,
} from './goDockerManifest';
import { buildRemote, resolvePublishTarget } from './remote';
import { deployAccountStack, deployBootstrapStack, deployDomainStack } from './stacks';
import { getViewsS3Destinations, NO_CACHE_FILES } from './viewsSync';

const IMAGE_TAG = 'qpq-cdk-deployer';
const AWS_CLI_IMAGE = 'amazon/aws-cli';

const BUILD_CONCURRENCY = Number(process.env.GO_DOCKER_BUILD_CONCURRENCY) || os.availableParallelism();
const DEPLOY_CONCURRENCY = Number(process.env.GO_DOCKER_DEPLOY_CONCURRENCY) || Infinity;

// Credentials/region reach the containers via `docker run -e NAME` (value
// inherited from this process's env, never on the docker command line).
const AWS_ENV_PASSTHROUGH = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SESSION_TOKEN',
  'AWS_REGION',
  'AWS_DEFAULT_REGION',
  'AWS_DEFAULT_ACCOUNT',
];

type ServicesPlan = Extract<DeployPlan, { kind: 'services' }>;

type StackNeeds = { inf: boolean; api: boolean; web: boolean; views: boolean };

const getStackNeeds = (stacks: StackType): StackNeeds => ({
  inf: stacks === 'all' || stacks === 'inf',
  api: stacks === 'all' || stacks === 'api',
  web: stacks === 'all' || stacks === 'web',
  views: stacks === 'all' || stacks === 'views',
});

// A container left behind by an interrupted run would block reusing its name.
// Clear it first, best-effort: a missing container (exit 1) must not fail the
// deploy. Was a `docker rm -f … >/dev/null 2>&1 ;` prefix on the run command,
// but that only worked under `shell: true`; as a separate call it's shell-free.
const removeContainer = (containerName: string): Promise<void> => runCommandBestEffort('docker', ['rm', '-f', containerName]);

const assertDockerRunning = async (): Promise<void> => {
  try {
    await runCommand('docker', ['info', '--format', 'docker daemon ok — server {{.ServerVersion}}']);
  } catch {
    throw new Error('Docker daemon is not running (start Docker Desktop and retry).');
  }
};

// Pin the image's CDK CLI to the CLI's own aws-cdk version so it can always
// read the assembly schema the host synthesized.
const buildDeployerImage = async (cdkVersion: string): Promise<void> => {
  console.log(`Building deployer image [${IMAGE_TAG}] (aws-cdk ${cdkVersion})`);
  await runCommand('docker', ['build', '-t', IMAGE_TAG, '--build-arg', `CDK_VERSION=${cdkVersion}`, getDockerDir()]);
};

// Deploy one stack from a pre-synthesized assembly in a throwaway container
// named <service>-<stackType> (e.g. mini-web) so `docker ps` reads cleanly.
// The assembly mounts read-only and is copied container-local first — the CDK
// CLI writes lock files next to the assembly it reads, and the copy keeps
// parallel api/web deploys of the same service fully isolated.
const dockerDeployStack = async (
  color: number,
  serviceName: string,
  stackType: 'inf' | 'api' | 'web',
  stackName: string,
  assemblyDir: string,
): Promise<void> => {
  const containerName = `${serviceName}-${stackType}`;
  await removeContainer(containerName);
  await runCommandPrefixed(
    `${stackType}:${serviceName}`,
    'docker',
    [
      'run',
      '--rm',
      '--name',
      containerName,
      '-v',
      `${assemblyDir}:/assembly:ro`,
      ...AWS_ENV_PASSTHROUGH.flatMap((name) => ['-e', name]),
      IMAGE_TAG,
      'bash',
      '-c',
      `cp -r /assembly /work/assembly && cdk deploy ${stackName} --app /work/assembly --require-approval never --progress events`,
    ],
    { color },
  );
};

// Sync one service's pre-built views to S3 in a throwaway aws-cli container
// named <service>-views. The official image's entrypoint is `aws`. Multiple
// destinations (shell → website root + views prefix) run sequentially within
// the service, reusing the container name. Mirrors the host-side syncViewsToS3
// cache policy: hashed assets immutable, the fixed-name entry points re-uploaded
// with no-cache every deploy (see NO_CACHE_FILES).
const dockerSyncViews = async (color: number, serviceName: string, views: GoDockerViewsEntry): Promise<void> => {
  const containerName = `${serviceName}-views`;
  const distDir = fromManifestPath(views.dir);

  const runAwsCli = async (awsArgs: string[]): Promise<void> => {
    await removeContainer(containerName);
    await runCommandPrefixed(
      `views:${serviceName}`,
      'docker',
      [
        'run',
        '--rm',
        '--name',
        containerName,
        '-v',
        `${distDir}:/views:ro`,
        ...AWS_ENV_PASSTHROUGH.flatMap((name) => ['-e', name]),
        AWS_CLI_IMAGE,
        ...awsArgs,
      ],
      { color },
    );
  };

  for (const destination of views.destinations) {
    await runAwsCli([
      's3',
      'sync',
      '/views',
      destination,
      '--cache-control',
      'public,max-age=31536000,immutable',
      ...NO_CACHE_FILES.flatMap((file) => ['--exclude', file]),
    ]);

    for (const file of NO_CACHE_FILES) {
      if (!fs.existsSync(path.join(distDir, file))) {
        continue;
      }

      await runAwsCli(['s3', 'cp', `/views/${file}`, `${destination}/${file}`, '--cache-control', 'no-cache']);
    }
  }
};

// Publish one service's already-built federated remote to S3 in a throwaway
// aws-cli container named <service>-publish. The version dir (everything the
// manifest references) syncs first, then the manifest.json is copied last —
// same ordering guarantee as the host-side publish, so a reading lambda never
// sees a manifest whose files aren't all present yet.
const dockerPublishRemote = async (color: number, serviceName: string, remote: GoDockerRemoteEntry): Promise<void> => {
  const { manifestHash, bucketName, servicePrefix } = remote;
  const publishPath = fromManifestPath(remote.dir);
  const containerName = `${serviceName}-publish`;

  // /publish is the service-remote-published dir; the hashed version subdir and
  // manifest.json both live directly under it.
  const s3Operations: string[][] = [
    ['s3', 'sync', `/publish/${manifestHash}`, `s3://${bucketName}/${servicePrefix}/${manifestHash}`],
    ['s3', 'cp', '/publish/manifest.json', `s3://${bucketName}/${servicePrefix}/manifest.json`],
  ];

  for (const s3Operation of s3Operations) {
    await removeContainer(containerName);
    await runCommandPrefixed(
      `publish:${serviceName}`,
      'docker',
      [
        'run',
        '--rm',
        '--name',
        containerName,
        '-v',
        `${publishPath}:/publish:ro`,
        ...AWS_ENV_PASSTHROUGH.flatMap((name) => ['-e', name]),
        AWS_CLI_IMAGE,
        ...s3Operation,
      ],
      { color },
    );
  }
};

const resolveRemoteEntry = (appName: string, service: string): GoDockerRemoteEntry => {
  const { publishPath, manifestHash, bucketName, servicePrefix } = resolvePublishTarget(appName, service);
  return { dir: toManifestPath(publishPath), manifestHash, bucketName, servicePrefix };
};

// Everything the deploy half needs that only the live config can answer,
// resolved here while the workspace is built and the config loads.
const resolveBuildManifest = (
  appName: string,
  deploymentName: string,
  service: string,
  stacks: StackType,
  hasViews: boolean,
  hasRemote: boolean,
  cdkVersion: string,
): GoDockerBuildManifest => {
  const qpqConfig = loadServiceQpqConfig(appName, service);

  return {
    cdkVersion,
    deploymentName,
    builtFor: stacks,
    stacks:
      stacks === 'views'
        ? null
        : {
            inf: qpqDeployAwsCdkUtils.getInfStackName(qpqConfig),
            api: qpqDeployAwsCdkUtils.getApiStackName(qpqConfig),
            web: qpqDeployAwsCdkUtils.getWebStackName(qpqConfig),
          },
    views: hasViews ? { dir: toManifestPath(getViewsDistDir(appName, service)), destinations: getViewsS3Destinations(appName, service) } : null,
    remote: hasRemote ? resolveRemoteEntry(appName, service) : null,
  };
};

// The directories a CI job uploads to carry one service's saved build to the
// deploy job, root-relative.
const getSavedBuildDirs = (appName: string, service: string, manifest: GoDockerBuildManifest): string[] => [
  toManifestPath(getGoDockerBuildDir(appName, service)),
  ...(manifest.views ? [manifest.views.dir] : []),
  ...(manifest.remote ? [manifest.remote.dir] : []),
];

const buildGoDockerOutput = async (appName: string, deploymentName: string, plan: ServicesPlan): Promise<void> => {
  const { services, stacks } = plan;
  const need = getStackNeeds(stacks);
  const needCdkSynth = stacks !== 'views';

  const viewServices = need.views ? services.filter((service) => getServiceNamesWithViews(appName).includes(service)) : [];

  console.log('\n=== Build ===\n');

  // A stale assembly or manifest from an earlier build must not outlive a
  // change of stack selection, so every selected service starts empty.
  for (const service of services) {
    fs.rmSync(getGoDockerBuildDir(appName, service), { recursive: true, force: true });
  }

  await runAppHook(appName, 'predeploy');

  // Workspace packages resolve through their built dist/ (package.json main),
  // so bundles would ship stale code unless every lib is tsc'd first. npm runs
  // the workspaces in topological order; tsc -b is incremental, so this is
  // seconds when nothing changed.
  console.log('Building workspace packages');
  await runCommand('npm', ['run', 'build', '--workspaces', '--if-present']);

  // Synth the selected services' QPQ configs (and shell's, which the views
  // destinations resolve from) so a config that fails to load fails here,
  // before any bundling. In-process: it's just config loads + JSON writes.
  const qpqSynthServices = [...new Set([...services, ...(need.views ? ['shell'] : [])])];
  for (const service of qpqSynthServices) {
    await synthCommand([service, '--app', appName]);
  }

  // Federated remotes are the backend story code, so they are rebuilt (and
  // later republished) whenever the api stack is. Skips services without
  // defineFederatedModuleStore(...). Detected here (after the workspace build)
  // because it loads each service's config.
  const federatedServices = need.api ? getServiceNamesWithFederation(appName, services) : [];

  if (needCdkSynth) {
    assertNoFailures(
      'API bundling',
      await runTasks(
        services.map((service) => ({
          label: `bundle-api:${service}`,
          run: async () => {
            console.log(`Bundling api: [${service}]`);
            const qpqConfig = loadServiceQpqConfig(appName, service);
            await runRspack(getServiceRspackConfig(qpqConfig, path.join(getServiceDirectory(appName, service), 'service')));
          },
        })),
        BUILD_CONCURRENCY,
      ),
    );
  }

  assertNoFailures(
    'Views bundling',
    await runTasks(
      viewServices.map((service) => ({
        label: `bundle-views:${service}`,
        run: async () => {
          console.log(`Bundling views: [${service}]`);
          await bundleViews(appName, service);
        },
      })),
      BUILD_CONCURRENCY,
    ),
  );

  // Build the federated remotes now (rspack needs the workspace), so the
  // publish wave only has to sync the already-built output — mirroring how
  // views are bundled here and synced later.
  assertNoFailures(
    'Remote bundling',
    await runTasks(
      federatedServices.map((service) => ({
        label: `bundle-remote:${service}`,
        run: async () => {
          console.log(`Bundling federated remote: [${service}]`);
          await buildRemote(appName, service);
        },
      })),
      BUILD_CONCURRENCY,
    ),
  );

  if (needCdkSynth) {
    // One self-contained cloud assembly per service (all its stacks + staged
    // assets) — separate --output dirs so synths can run in parallel and
    // containers never share mutable state.
    assertNoFailures(
      'CDK synth',
      await runTasks(
        services.map((service) => ({
          label: `cdk-synth:${service}`,
          run: () =>
            runCommandPrefixed(
              `cdk-synth:${service}`,
              'npx',
              ['cdk', 'synth', '--quiet', '--app', getCdkAppCommand(), '--output', getGoDockerAssemblyDir(appName, service)],
              {
                cwd: getRoot(),
                env: { DEPLOY_SERVICE_NAME: service, DEPLOY_APP_NAME: appName },
                color: nextPrefixColor(),
              },
            ),
        })),
        BUILD_CONCURRENCY,
      ),
    );
  }

  // Manifests are written last, so one only ever exists beside a complete build.
  const cdkVersion = getCdkCliVersion();
  for (const service of services) {
    const manifest = resolveBuildManifest(
      appName,
      deploymentName,
      service,
      stacks,
      viewServices.includes(service),
      federatedServices.includes(service),
      cdkVersion,
    );
    writeGoDockerBuildManifest(appName, service, manifest);

    console.log(`Saved build for [${service}]:`);
    for (const dir of getSavedBuildDirs(appName, service, manifest)) {
      console.log(`  ${dir}`);
    }
  }
};

// A deploy phase runs from a saved build only when that build was made for it:
// `all` covers every phase, any other selection only its own. A build made for
// `inf` has an assembly the api stack could deploy from, but no remote to
// publish after it, which is exactly the stale-stories deploy the publish
// ordering exists to prevent.
const readCheckedManifest = (
  appName: string,
  deploymentName: string,
  service: string,
  stacks: StackType,
  cdkVersion: string,
): GoDockerBuildManifest => {
  const manifest = readGoDockerBuildManifest(appName, service);
  const rebuild = `rebuild it with \`qpq go:docker ${service} ${stacks} --build-only --app ${appName} --deployment ${deploymentName}\``;

  if (manifest.cdkVersion !== cdkVersion) {
    throw new Error(`saved build for [${service}] was synthesized with aws-cdk ${manifest.cdkVersion}, this qpq has ${cdkVersion}; ${rebuild}`);
  }
  if (manifest.deploymentName !== deploymentName) {
    throw new Error(`saved build for [${service}] is for deployment '${manifest.deploymentName}', not '${deploymentName}'; ${rebuild}`);
  }
  if (manifest.builtFor !== 'all' && manifest.builtFor !== stacks) {
    throw new Error(`saved build for [${service}] was built for '${manifest.builtFor}' stacks and cannot deploy '${stacks}'; ${rebuild}`);
  }

  return manifest;
};

const getStackName = (manifest: GoDockerBuildManifest, service: string, stackType: 'inf' | 'api' | 'web'): string => {
  if (!manifest.stacks) {
    throw new Error(`saved build for [${service}] has no cloud assembly (it was built for views only)`);
  }
  return manifest.stacks[stackType];
};

const deployGoDockerOutput = async (appName: string, deploymentName: string, plan: ServicesPlan): Promise<void> => {
  const { services, stacks } = plan;
  const need = getStackNeeds(stacks);
  const needCdkDeploys = stacks !== 'views';

  // Every manifest is read and checked up front, so one missing or mismatched
  // build fails the run before any container starts.
  const cdkVersion = getCdkCliVersion();
  const manifests = new Map(services.map((service) => [service, readCheckedManifest(appName, deploymentName, service, stacks, cdkVersion)]));
  const manifestFor = (service: string): GoDockerBuildManifest => manifests.get(service)!;

  const viewServices = need.views ? services.filter((service) => manifestFor(service).views !== null) : [];
  const federatedServices = need.api ? services.filter((service) => manifestFor(service).remote !== null) : [];

  // Federated publish needs the api stack (need.api ⇒ needCdkDeploys), so any
  // docker preflight it requires is already covered by these two checks.
  if (needCdkDeploys || viewServices.length > 0) {
    await assertDockerRunning();
  }
  if (needCdkDeploys) {
    await buildDeployerImage(cdkVersion);
  }

  // The aws-cli image backs both the views sync and the federated publish
  // waves. Pull once now so those waves don't race N containers into pulling
  // the same image.
  if (viewServices.length > 0 || federatedServices.length > 0) {
    await runCommand('docker', ['pull', AWS_CLI_IMAGE]);
  }

  // ---- Wave 1: inf stacks, one container per service, all concurrent ----
  if (need.inf) {
    console.log('\n=== Deploy inf stacks (docker) ===\n');
    logTimeStart('infWave');
    assertNoFailures(
      'Inf deploy',
      await runTasks(
        services.map((service) => ({
          label: `inf:${service}`,
          run: () =>
            dockerDeployStack(
              nextPrefixColor(),
              service,
              'inf',
              getStackName(manifestFor(service), service, 'inf'),
              getGoDockerAssemblyDir(appName, service),
            ),
        })),
        DEPLOY_CONCURRENCY,
      ),
    );
    logTimeEnd('infWave');
  }

  // ---- Wave 2: api + web stacks, all concurrent ----
  if (need.api || need.web) {
    console.log('\n=== Deploy api + web stacks (docker) ===\n');
    logTimeStart('apiWebWave');
    assertNoFailures(
      'Api/Web deploy',
      await runTasks(
        (['api', 'web'] as const)
          .filter((stackType) => (stackType === 'api' ? need.api : need.web))
          .flatMap((stackType) =>
            services.map((service) => ({
              label: `${stackType}:${service}`,
              run: () =>
                dockerDeployStack(
                  nextPrefixColor(),
                  service,
                  stackType,
                  getStackName(manifestFor(service), service, stackType),
                  getGoDockerAssemblyDir(appName, service),
                ),
            })),
          ),
        DEPLOY_CONCURRENCY,
      ),
    );
    logTimeEnd('apiWebWave');
  }

  // ---- Views: sync the pre-built bundles to S3, all concurrent ----
  if (viewServices.length > 0) {
    console.log('\n=== Sync views to S3 (docker) ===\n');
    logTimeStart('viewsWave');
    assertNoFailures(
      'Views sync',
      await runTasks(
        viewServices.map((service) => ({
          label: `views:${service}`,
          run: () => dockerSyncViews(nextPrefixColor(), service, manifestFor(service).views!),
        })),
        DEPLOY_CONCURRENCY,
      ),
    );
    logTimeEnd('viewsWave');
  }

  // ---- Publish: the pre-built federated remotes to S3, all concurrent ----
  if (federatedServices.length > 0) {
    console.log('\n=== Publish federated remotes to S3 (docker) ===\n');
    logTimeStart('publishWave');
    assertNoFailures(
      'Federated publish',
      await runTasks(
        federatedServices.map((service) => ({
          label: `publish:${service}`,
          run: () => dockerPublishRemote(nextPrefixColor(), service, manifestFor(service).remote!),
        })),
        DEPLOY_CONCURRENCY,
      ),
    );
    logTimeEnd('publishWave');
  }
};

export const awsGoDocker = async (appName: string, plan: DeployPlan, mode: GoDockerMode): Promise<void> => {
  if (plan.kind === 'cancelled') {
    return;
  }

  if ((await isAwsCredentialsValid()) === false) {
    console.log('Credentials are expired or invalid.');
    return;
  }

  logTimeStart('totalTime');

  if (plan.kind === 'account') {
    await deployAccountStack(plan.appName);
    logTimeEnd('totalTime');
    return;
  }

  if (plan.kind === 'bootstrap') {
    if (plan.includeDomain) {
      await deployDomainStack(plan.appName);
    }
    await deployBootstrapStack(plan.appName);
    logTimeEnd('totalTime');
    return;
  }

  // resolveDeployment primed the selection before this driver ran. The manifest
  // records it so a build for one deployment can never deploy to another.
  const deploymentName = process.env[QpqDeployEnvVar.deployName];
  if (!deploymentName) {
    throw new Error(`no deployment selected (${QpqDeployEnvVar.deployName} is unset)`);
  }

  console.log(`\n\nRunning dockerized deploy (${mode})\n\n`);
  console.log('Executing for services');
  console.log(plan.services.join(', '));

  if (mode !== 'from-build') {
    await buildGoDockerOutput(appName, deploymentName, plan);
  }
  if (mode !== 'build-only') {
    await deployGoDockerOutput(appName, deploymentName, plan);
  }

  logTimeEnd('totalTime');
};
