// The CDK app command (`cdk ... --app "node -r ts-node/register/transpile-only <this file>"`).
// Runs under ts-node hooks so per-app TS config fragments and service
// infrastructure.ts files can be required directly.
import { createWorkspaceQpqCdkApp } from 'quidproquo-deploy-awscdk';

createWorkspaceQpqCdkApp();
