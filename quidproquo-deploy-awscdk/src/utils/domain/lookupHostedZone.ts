import { aws_route53, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/** One `HostedZone.fromLookup` per zone per stack: repeated lookups of the same zone share the construct. */
export const lookupHostedZone = (scope: Construct, zoneName: string): aws_route53.IHostedZone => {
  const stack = Stack.of(scope);
  const id = `qpq-zone-${zoneName.replace(/[^a-zA-Z0-9]/g, '-')}`;

  const existing = stack.node.tryFindChild(id) as aws_route53.IHostedZone | undefined;

  return existing ?? aws_route53.HostedZone.fromLookup(stack, id, { domainName: zoneName });
};
