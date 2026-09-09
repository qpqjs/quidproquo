import { qpqDeployAwsCdkUtils } from 'quidproquo-deploy-awscdk';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { ListHostedZonesByNameCommand, Route53Client } from '@aws-sdk/client-route-53';

import { SetupCheckResult, SetupStep } from '../../../lib/setupStep';
import { AwsSetupContext } from './awsSetupContext';

// The zones the environment writes records into: one per root, chosen the way the
// CDK chooses them (each root's site root under the app's resolver, or the root).
const getRequiredZones = (ctx: AwsSetupContext): string[] => {
  const config = ctx.bootstrapQpqConfig;
  return [
    ...new Set(
      qpqWebServerUtils
        .getRootDomains(config)
        .map((rootDomain) =>
          qpqDeployAwsCdkUtils.resolveHostedZoneForHost(config, qpqDeployAwsCdkUtils.resolveDeployHostForRoot(config, rootDomain, {})),
        ),
    ),
  ];
};

const zoneExists = async (client: Route53Client, zoneName: string): Promise<boolean> => {
  const { HostedZones } = await client.send(new ListHostedZonesByNameCommand({ DNSName: zoneName, MaxItems: 1 }));
  return (HostedZones ?? []).some((zone) => zone.Name === `${zoneName}.` && !zone.Config?.PrivateZone);
};

const checkHostedZones = async (ctx: AwsSetupContext): Promise<SetupCheckResult> => {
  const required = getRequiredZones(ctx);
  if (required.length === 0) {
    return { done: true, detail: 'no domains declared' };
  }

  const client = new Route53Client({ region: ctx.region });
  const missing: string[] = [];
  for (const zoneName of required) {
    if (!(await zoneExists(client, zoneName))) {
      missing.push(zoneName);
    }
  }

  return missing.length === 0
    ? { done: true, detail: required.join(', ') }
    : {
        done: false,
        detail: `missing ${missing.join(', ')}: create each as a public hosted zone here and delegate it (NS record) from its parent zone`,
      };
};

/** Check-only: the Route53 zones the deploy will write records into exist in this account. */
export const buildHostedZonesStep = (ctx: AwsSetupContext): SetupStep => ({
  id: 'hosted-zones',
  name: 'Route53 hosted zones',
  check: () => checkHostedZones(ctx),
  run: async () => {
    const result = await checkHostedZones(ctx);
    if (!result.done) {
      throw new Error(result.detail ?? 'hosted zones missing');
    }
  },
});
