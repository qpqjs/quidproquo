// `qpq script:builder-layer [--arch arm64|x86_64]`, produce the lambda layer that gives
// a service rspack, for services that registered defineUserScriptBuilder. The directory
// is the one getUserScriptBuilderApiLayer points at, so nothing is told a path. Run from
// the app's qpq:predeploy hook, which go:docker fires before the workspace is built, so
// this command deliberately loads no service config (that would import unbuilt packages)
// and takes the lambda architecture as a flag instead.
import { JavascriptRuntimeArchitecture } from '@qpqjs/core';
import { getUserScriptBuilderLayerDir } from '@qpqjs/user-script';

import { getArgValue } from '../lib/args';
import { buildUserScriptBuilderLayer } from '../lib/userScriptBuilderLayer';

const ARCH_FLAG = '--arch';
const DEFAULT_ARCHITECTURE = JavascriptRuntimeArchitecture.Arm64;

/* eslint-disable @typescript-eslint/no-require-imports */
// The rspack the CLI itself resolves is the one the dev server builds with; the layer
// pins the same version so a script builds identically on both runtimes.
const getRspackVersion = (): string => require('@rspack/core/package.json').version as string;

const parseArchitecture = (argv: string[]): JavascriptRuntimeArchitecture => {
  const requested = getArgValue(argv, ARCH_FLAG) ?? DEFAULT_ARCHITECTURE;
  const known = Object.values(JavascriptRuntimeArchitecture);
  if (!known.includes(requested as JavascriptRuntimeArchitecture)) {
    console.error(`script:builder-layer: unknown ${ARCH_FLAG} [${requested}]; expected one of ${known.join(', ')}`);
    process.exit(1);
  }
  return requested as JavascriptRuntimeArchitecture;
};

export const scriptBuilderLayerCommand = async (argv: string[]): Promise<void> => {
  const architecture = parseArchitecture(argv);
  const rspackVersion = getRspackVersion();
  const outDir = getUserScriptBuilderLayerDir();

  console.log(`script:builder-layer: installing @rspack/core@${rspackVersion} for linux ${architecture} into ${outDir}`);
  const nodeDir = buildUserScriptBuilderLayer({ outDir, architecture, rspackVersion });
  console.log(`script:builder-layer: wrote ${nodeDir}`);
};
