import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, defineSecret, QPQConfigItem } from '@qpqjs/core';

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Function } from './Function';

// The construct packages a built handler directory as the lambda asset, so a throwaway build root
// with one empty handler stands in for the real api build.
let configRoot: string;

const synth = (settings: QPQConfigItem[] = [], environment: Record<string, string> = {}) => {
  const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'), ...settings], { configRoot });
  const stack = new Stack(new App(), 'api', { env: { account: '123456789012', region: 'ap-southeast-2' } });

  new Function(stack, 'fn', { qpqConfig, handler: 'handler', environment, reservedConcurrentExecutions: 3 });

  return Template.fromStack(stack);
};

beforeEach(() => {
  configRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-fn-'));
  fs.mkdirSync(path.join(configRoot, 'build', 'handler'), { recursive: true });
  fs.writeFileSync(path.join(configRoot, 'build', 'handler', 'index.js'), 'exports.handler = async () => {};');
});

afterEach(() => {
  fs.rmSync(configRoot, { recursive: true, force: true });
});

// Security regression: a function's environment carries only names and pointers, never a secret
// value, and every function ships with its own log group at the configured retention and tracing on.
describe('Function', () => {
  it('puts only the connection reuse flag and the given names into the environment', () => {
    const template = synth([defineSecret('dbPassword')], { storeName: 'orders' });

    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: { Variables: { AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1', storeName: 'orders' } },
    });
    expect(JSON.stringify(template.toJSON())).not.toContain('dbPassword');
  });

  it('traces, reserves concurrency and logs to its own log group at the account default retention', () => {
    const template = synth();

    template.hasResourceProperties('AWS::Lambda::Function', {
      TracingConfig: { Mode: 'Active' },
      ReservedConcurrentExecutions: 3,
      LoggingConfig: { LogGroup: Match.anyValue() },
    });
    template.hasResourceProperties('AWS::Logs::LogGroup', { RetentionInDays: 7 });
  });
});
