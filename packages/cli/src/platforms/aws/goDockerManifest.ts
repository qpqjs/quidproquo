// The saved build `qpq go:docker --build-only` leaves behind and `--from-build`
// deploys from. Per service it is the CDK cloud assembly plus a manifest under
// dist/qpq/go-docker/<app>/<service>, with the views bundle and the federated
// remote left where their bundlers write them and pointed at from the manifest.
import { Nullable } from 'quidproquo-core';

import fs from 'fs';
import path from 'path';

import { StackType } from '../../lib/deployPrompts';
import { getRoot } from '../../lib/discovery';

/** The CloudFormation stack names of one service's assembly. */
export type GoDockerStackNames = { inf: string; api: string; web: string };

/** A built views bundle and the S3 locations it syncs to. */
export type GoDockerViewsEntry = { dir: string; destinations: string[] };

/** A built federated remote (its publish dir and the store it goes into). */
export type GoDockerRemoteEntry = { dir: string; manifestHash: string; bucketName: string; servicePrefix: string };

/**
 * Everything the deploy half needs for one service that only the live config can
 * answer, resolved by the build half. Paths are relative to the consumer root with
 * forward slashes, so a build saved on one machine deploys from another checkout.
 */
export type GoDockerBuildManifest = {
  // The aws-cdk that synthesized the assembly; the deploy half refuses any other.
  cdkVersion: string;
  deploymentName: string;
  // The stack selection the build ran with: `all` can deploy any phase, anything else only its own.
  builtFor: StackType;
  // Null for a views-only build, which synthesizes nothing.
  stacks: Nullable<GoDockerStackNames>;
  // Null when the service has no views or they were not built.
  views: Nullable<GoDockerViewsEntry>;
  // Null when the service has no defineFederatedModuleStore(...) or the api was not built.
  remote: Nullable<GoDockerRemoteEntry>;
};

const MANIFEST_FILE = 'deploy.json';

/** The per-service directory the build half owns: the cloud assembly and the manifest. */
export const getGoDockerBuildDir = (appName: string, serviceName: string): string =>
  path.join(getRoot(), 'dist', 'qpq', 'go-docker', appName, serviceName);

/** Where `cdk synth --output` writes the service's self-contained cloud assembly. */
export const getGoDockerAssemblyDir = (appName: string, serviceName: string): string =>
  path.join(getGoDockerBuildDir(appName, serviceName), 'assembly');

/** A path under the consumer root, as the manifest stores it. */
export const toManifestPath = (absolutePath: string): string => path.relative(getRoot(), absolutePath).split(path.sep).join('/');

/** The absolute path a manifest entry points at on this machine. */
export const fromManifestPath = (manifestPath: string): string => path.resolve(getRoot(), manifestPath);

export const writeGoDockerBuildManifest = (appName: string, serviceName: string, manifest: GoDockerBuildManifest): void => {
  const buildDir = getGoDockerBuildDir(appName, serviceName);
  fs.mkdirSync(buildDir, { recursive: true });
  fs.writeFileSync(path.join(buildDir, MANIFEST_FILE), JSON.stringify(manifest, null, 2));
};

/** Throws, naming the directory and the command that fills it, when the service has no saved build. */
export const readGoDockerBuildManifest = (appName: string, serviceName: string): GoDockerBuildManifest => {
  const manifestPath = path.join(getGoDockerBuildDir(appName, serviceName), MANIFEST_FILE);

  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `no saved build for [${serviceName}] (missing ${manifestPath}) - run \`qpq go:docker ${serviceName} <stack> --build-only --app ${appName}\` first`,
    );
  }

  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as GoDockerBuildManifest;
};
