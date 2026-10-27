# quidproquo-config-aws

AWS-specific configuration for [quidproquo](https://github.com/qpqjs/quidproquo).

A qpq config is a plain array of settings. Core and webserver settings describe resources in platform-neutral terms (a key value store, a queue, a route). This package holds the settings that only mean something on AWS, each keyed by the core resource it applies to and resolved at deploy time.

That split is deliberate: a service config stays portable, and the AWS detail sits in one place you can point at.

```bash
npm install quidproquo-config-aws
```

You usually pair it with [`quidproquo-deploy-awscdk`](https://www.npmjs.com/package/quidproquo-deploy-awscdk), which reads these settings and builds the stacks.

## What you can configure

| Setting | For |
| --- | --- |
| `defineAwsServiceAccountInfo` | Which account and region a service deploys into |
| `defineAwsDyanmoOverrideForKvs` | DynamoDB specifics for a key value store: indexes, capacity, streams |
| `defineAwsDataStoreRemovalPolicy` | Whether data stores survive a stack delete |
| `defineAwsVirtualNetworkSettings` | VPC placement |
| `defineAwsAlarm`, `defineAwsServiceDashboard` | CloudWatch alarms and dashboards |
| `defineDomainCertificate` | ACM certificates, including cross-region for CloudFront |
| `defineEmailSenderAllowList` | SES sender restrictions |
| `defineEventBusQuickSubscription` | Shortcut subscriptions on an event bus topic |
| `defineBootstrapWaf`, `defineWafProtection` | Web ACLs and which resources sit behind them |
| `defineBootstrapAwsOrganization` | Organization structure |
| `defineAccountBudget`, `defineAccountCloudTrail`, `defineAccountSecurityServices` | Account-level budgets, audit trail, and security services |

## Naming

Resource names are derived from the account, region, and config name rather than being set by hand. The runtime processors derive them the same way, so nothing has to be threaded between deploy and run.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
