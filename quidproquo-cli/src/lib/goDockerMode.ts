import { hasArgFlag } from './args';

/** Which half of `qpq go:docker` a run performs: both, the build and save, or the deploy from a saved build. */
export type GoDockerMode = 'full' | 'build-only' | 'from-build';

export const BUILD_ONLY_FLAG = '--build-only';
export const FROM_BUILD_FLAG = '--from-build';

/** Reads the mode off the command's argv. Throws when both flags are given, since one run cannot be both halves. */
export const resolveGoDockerMode = (argv: string[]): GoDockerMode => {
  const buildOnly = hasArgFlag(argv, BUILD_ONLY_FLAG);
  const fromBuild = hasArgFlag(argv, FROM_BUILD_FLAG);

  if (buildOnly && fromBuild) {
    throw new Error(`${BUILD_ONLY_FLAG} and ${FROM_BUILD_FLAG} are exclusive: build on one run, deploy on another`);
  }
  if (buildOnly) {
    return 'build-only';
  }
  if (fromBuild) {
    return 'from-build';
  }
  return 'full';
};
