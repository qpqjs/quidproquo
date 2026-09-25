import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { promptSelect } from './prompts';
import { resolveDeployment } from './resolveDeployment';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-cli-deployment-'));
const writeConfig = (appName: string, deployments: Record<string, unknown>) => {
  fs.mkdirSync(path.join(root, 'apps', appName), { recursive: true });
  fs.writeFileSync(path.join(root, 'apps', appName, 'deploy.config.json'), JSON.stringify({ deployments }));
};

const aws = (name: string, environment: string, extra: Record<string, unknown> = {}) => ({
  platform: 'aws',
  name,
  environment,
  platformSettings: { accountId: '123456789012', region: 'ap-southeast-2' },
  ...extra,
});

writeConfig('solo', { only: aws('solo', 'development', { settings: { PAGE_TITLE: 'Solo' } }) });
writeConfig('multi', {
  'example-dev': aws('example', 'development'),
  'other-prod': aws('other', 'production'),
  local: { platform: 'docker', name: 'example', environment: 'local' },
});
writeConfig('broken', { prod: { platform: 'aws', name: 'x', environment: 'production' } });

vi.mock('./discovery', () => ({ getRoot: () => root }));
vi.mock('./prompts', () => ({ promptSelect: vi.fn(async () => 'other-prod') }));
vi.mock('../platforms', async () => {
  const { primeAwsDeploymentEnv, validateAwsDeployment } = await import('quidproquo-config-aws');
  const drivers: Record<string, { prepareDeployment: (name: string, deployment: unknown) => void }> = {
    aws: { prepareDeployment: (name, deployment) => primeAwsDeploymentEnv(validateAwsDeployment(name, deployment as never)) },
    docker: { prepareDeployment: () => {} },
  };
  return { getPlatformDriver: (platform: string) => drivers[platform] };
});

const primed = [
  'DEPLOY_APP_NAME',
  'DEPLOY_NAME',
  'APPLICATION_NAME',
  'ENVIRONMENT',
  'FEATURE_NAME',
  'AWS_DEFAULT_ACCOUNT',
  'AWS_DEFAULT_REGION',
  'DEPLOY_SETTING_PAGE_TITLE',
];
let exitSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  exitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new Error(`exit ${code}`);
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

const originalIsTTY = process.stdin.isTTY;

afterEach(() => {
  vi.restoreAllMocks();
  process.stdin.isTTY = originalIsTTY;
  for (const name of primed) delete process.env[name];
});

afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('resolveDeployment', () => {
  it('auto-selects a sole entry and primes everything from it', async () => {
    const { deploymentName } = await resolveDeployment([], 'solo');

    expect(deploymentName).toBe('only');
    expect(process.env.DEPLOY_NAME).toBe('only');
    expect(process.env.APPLICATION_NAME).toBe('solo');
    expect(process.env.ENVIRONMENT).toBe('development');
    expect(process.env.AWS_DEFAULT_ACCOUNT).toBe('123456789012');
    expect(process.env.DEPLOY_SETTING_PAGE_TITLE).toBe('Solo');
  });

  it('takes the flag over everything', async () => {
    process.env.DEPLOY_NAME = 'other-prod';

    const { deployment } = await resolveDeployment(['--deployment', 'example-dev'], 'multi');

    expect(deployment.name).toBe('example');
    expect(promptSelect).not.toHaveBeenCalled();
  });

  it('honours DEPLOY_NAME as a selector from a parent command', async () => {
    process.env.DEPLOY_NAME = 'example-dev';

    const { deploymentName } = await resolveDeployment([], 'multi');

    expect(deploymentName).toBe('example-dev');
  });

  it('prompts over the configured names when several exist', async () => {
    process.stdin.isTTY = true;

    const { deploymentName } = await resolveDeployment([], 'multi');

    expect(promptSelect).toHaveBeenCalledWith('Select deployment', ['example-dev', 'other-prod', 'local']);
    expect(deploymentName).toBe('other-prod');
    expect(process.env.ENVIRONMENT).toBe('production');
  });

  it('exits headless with several entries and no selection', async () => {
    process.stdin.isTTY = false;

    await expect(resolveDeployment([], 'multi')).rejects.toThrow('exit 1');
    expect(promptSelect).not.toHaveBeenCalled();
  });

  it('exits on an unknown deployment name', async () => {
    await expect(resolveDeployment(['--deployment=nope'], 'multi')).rejects.toThrow('exit 1');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('does not prime aws identity for a docker deployment', async () => {
    await resolveDeployment(['--deployment', 'local'], 'multi');

    expect(process.env.APPLICATION_NAME).toBe('example');
    expect(process.env.AWS_DEFAULT_ACCOUNT).toBeUndefined();
  });

  it('fails an aws deployment missing its identity before anything runs', async () => {
    await expect(resolveDeployment([], 'broken')).rejects.toThrow('"platformSettings.accountId"');
  });
});
