import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { defineUserScriptRunner } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { App, Stack } from 'aws-cdk-lib';
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';

import { QpqCoreUserScriptRunnerConstruct } from './QpqCoreUserScriptRunnerConstruct';

// The log extension layer is produced by the aws package build; a synth in a unit test only needs a directory to package.
const extensionLayer = vi.hoisted(() => ({ path: '' }));
vi.mock('@qpqjs/actionprocessor-aws', async (importOriginal: any) => ({
  ...((await importOriginal()) as typeof import('@qpqjs/actionprocessor-aws')),
  getLogExtensionLayerPath: () => extensionLayer.path,
}));

// Code.fromAsset needs the bundle folder to exist, so the config roots at a scratch build dir.
const configRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-runner-synth-'));
fs.mkdirSync(path.join(configRoot, 'build', 'userScriptRunnerEvent_userScript'), { recursive: true });
extensionLayer.path = path.join(configRoot, 'extension-layer');
fs.mkdirSync(extensionLayer.path);

const synth = () => {
  const qpqConfig = buildTestQpqConfig(
    [
      defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
      defineUserScriptRunner({ timeoutInSeconds: 45, memoryInMiB: 1024, maxConcurrentExecutions: 3 }),
    ],
    { configRoot },
  );
  const stack = new Stack(new App(), 'api', { env: { account: '123456789012', region: 'ap-southeast-2' } });
  new QpqCoreUserScriptRunnerConstruct(stack, 'runner', {
    qpqConfig,
    userScriptRunnerConfig: qpqConfig.find((s) => (s as any).uniqueKey === 'UserScriptRunner') as any,
  });
  return Template.fromStack(stack);
};

describe('QpqCoreUserScriptRunnerConstruct', () => {
  it('creates the runner function with the declared limits and no environment of its own', () => {
    const template = synth();

    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'uscript-runner-test-app-test-module-development',
      Handler: 'index.userScriptRunnerEvent_userScript',
      Timeout: 45,
      MemorySize: 1024,
      ReservedConcurrentExecutions: 3,
      Environment: { Variables: { AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1' } },
    });
  });

  it('gives the runner its own role with only the basic execution policy', () => {
    const template = synth();

    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'uscript-runner-role-test-app-test-module-development',
      AssumeRolePolicyDocument: Match.objectLike({ Statement: [Match.objectLike({ Principal: { Service: 'lambda.amazonaws.com' } })] }),
      ManagedPolicyArns: [
        Match.objectLike({ 'Fn::Join': Match.arrayWith([Match.arrayWith([':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'])]) }),
      ],
    });

    // The only role created in this stack is the runner's: the service role is imported, never recreated.
    template.resourceCountIs('AWS::IAM::Role', 1);
  });

  it('lets the service role invoke exactly this function', () => {
    const template = synth();
    const resources = new Capture();

    template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([Match.objectLike({ Action: 'lambda:InvokeFunction', Effect: 'Allow', Resource: resources })]),
      }),
    });

    expect(JSON.stringify(resources.asObject())).toContain('Fn::GetAtt');
    expect(JSON.stringify(resources.asObject())).not.toContain('*');
  });
});
