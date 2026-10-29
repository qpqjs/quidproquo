import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, defineUserScriptRunner } from '@qpqjs/core';

import { App, Stack } from 'aws-cdk-lib';
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { QpqCoreUserScriptRunnerConstruct } from './QpqCoreUserScriptRunnerConstruct';

// Code.fromAsset needs the bundle folder to exist, so the config roots at a scratch build dir.
const configRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-runner-synth-'));
fs.mkdirSync(path.join(configRoot, 'build', 'userScriptRunnerEvent_userScript'), { recursive: true });

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
    userScriptRunnerConfig: qpqConfig.find((s) => s.uniqueKey === 'UserScriptRunner') as any,
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
