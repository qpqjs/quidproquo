import path from 'path';

import { getOwnPackageRoot } from '../../lib/packageRoot';

// The CDK app command (`cdk ... --app "<this>"`): @qpqjs/deploy-awscdk's
// generic workspace app under ts-node hooks, with DEPLOY_* in the env.
export const getCdkAppCommand = (): string => {
  // Resolve ts-node from this package, not the workspace cwd — under npm link
  // the CLI's dependencies are never hoisted into the workspace's node_modules,
  // so a bare `-r ts-node/...` preload fails there.
  const tsNodeRegister = require.resolve('ts-node/register/transpile-only');
  const cdkAppScript = path.join(getOwnPackageRoot(), 'lib', 'commonjs', 'bin', 'qpqCdkApp.js');
  return `node -r "${tsNodeRegister}" "${cdkAppScript}"`;
};

// The CLI's own aws-cdk. The go:docker deployer image pins to it and a saved
// build records it, so the CDK that deploys an assembly is always the one that
// synthesized it and can read its schema.
export const getCdkCliVersion = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('aws-cdk/package.json').version as string;
};

// The docker build context for the go:docker deployer image.
export const getDockerDir = (): string => path.join(getOwnPackageRoot(), 'docker', 'cdk-deployer');
