import { runCommandCaptureSync, runCommandSync } from './runCommand';
import { JavascriptRuntimeArchitecture } from '@qpqjs/core';
import { USER_SCRIPT_BUILDER_LAYER_MODULES } from '@qpqjs/user-script';

import fs from 'fs';
import path from 'path';

const MIN_NPM_MAJOR = 9;

// Lambda's layer layout: /opt/nodejs/node_modules is on the function's module path.
const LAYER_NODE_DIR = 'nodejs';

const npmCpuByArchitecture: Record<JavascriptRuntimeArchitecture, 'arm64' | 'x64'> = {
  [JavascriptRuntimeArchitecture.Arm64]: 'arm64',
  [JavascriptRuntimeArchitecture.X86_64]: 'x64',
};

export type BuilderLayerInstallOptions = {
  outDir: string;
  architecture: JavascriptRuntimeArchitecture;
  rspackVersion: string;
};

/** The npm cpu name for a lambda architecture. */
const getBuilderLayerCpu = (architecture: JavascriptRuntimeArchitecture): 'arm64' | 'x64' => npmCpuByArchitecture[architecture];

/**
 * The npm argv that installs rspack for linux and the lambda's cpu into the layer's
 * nodejs directory. Pure, so the exact invocation is testable without running npm.
 */
export const getBuilderLayerInstallArgs = ({ outDir, architecture, rspackVersion }: BuilderLayerInstallOptions): string[] => [
  'install',
  '--prefix',
  path.join(outDir, LAYER_NODE_DIR),
  '--os=linux',
  `--cpu=${getBuilderLayerCpu(architecture)}`,
  '--libc=glibc',
  '--omit=dev',
  '--no-save',
  '--no-package-lock',
  '--no-audit',
  '--no-fund',
  `@rspack/core@${rspackVersion}`,
];

const parseMajor = (version: string): number => parseInt(version.split('.')[0] ?? '', 10);

export type BuilderLayerRunners = {
  getNpmVersion: () => string;
  runNpm: (args: string[]) => void;
};

const defaultRunners: BuilderLayerRunners = {
  getNpmVersion: () => runCommandCaptureSync('npm', ['--version']).trim(),
  runNpm: (args) => {
    runCommandSync('npm', args);
  },
};

/**
 * Produces the user-script builder layer directory: `<outDir>/nodejs/node_modules` holding
 * rspack and its linux binding for the lambda's cpu. Empties `outDir` first and verifies
 * the binding landed. Needs npm 9 or later for the `--os`/`--cpu` flags.
 */
export const buildUserScriptBuilderLayer = (options: BuilderLayerInstallOptions, runners: BuilderLayerRunners = defaultRunners): string => {
  const npmVersion = runners.getNpmVersion();
  if (parseMajor(npmVersion) < MIN_NPM_MAJOR) {
    throw new Error(`script:builder-layer needs npm ${MIN_NPM_MAJOR} or later for --os/--cpu installs; found ${npmVersion}`);
  }

  const nodeDir = path.join(options.outDir, LAYER_NODE_DIR);
  fs.rmSync(options.outDir, { recursive: true, force: true });
  fs.mkdirSync(nodeDir, { recursive: true });
  fs.writeFileSync(path.join(nodeDir, 'package.json'), JSON.stringify({ name: 'user-script-builder-layer', private: true }, null, 2));

  runners.runNpm(getBuilderLayerInstallArgs(options));

  const bindingDir = path.join(nodeDir, 'node_modules', '@rspack', `binding-linux-${getBuilderLayerCpu(options.architecture)}-gnu`);
  if (!fs.existsSync(bindingDir)) {
    throw new Error(`script:builder-layer: expected the rspack binding at [${bindingDir}] after install; the layer would not load on lambda`);
  }

  const installed = USER_SCRIPT_BUILDER_LAYER_MODULES.filter((name) => fs.existsSync(path.join(nodeDir, 'node_modules', name)));
  if (installed.length !== USER_SCRIPT_BUILDER_LAYER_MODULES.length) {
    throw new Error(
      `script:builder-layer: the layer is missing ${USER_SCRIPT_BUILDER_LAYER_MODULES.filter((name) => !installed.includes(name)).join(', ')}`,
    );
  }

  return nodeDir;
};
