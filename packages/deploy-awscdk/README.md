# quidproquo-deploy-awscdk

Turns a [quidproquo](https://github.com/qpqjs/quidproquo) config into AWS CDK stacks.

You declare resources in your service config (`defineKeyValueStore`, `defineQueue`, `defineRoute`, and so on). This package reads that config and synthesises the infrastructure to back it, wired to the Lambda handlers in `quidproquo-actionprocessor-awslambda`.

```bash
npm install quidproquo-deploy-awscdk
```

In practice you drive it through the [`qpq` CLI](https://www.npmjs.com/package/quidproquo-cli) rather than calling it directly.

## The stacks

A service deploys as a set of stacks rather than one, so that slow-moving infrastructure and fast-moving code are not redeployed together:

| Stack | Holds |
| --- | --- |
| `BootstrapQpqServiceStack` | The account groundwork: the apex domain, hosted zone, and shared certificates |
| `AccountQpqStack` | Account-level settings: budgets, CloudTrail, security services |
| `InfQpqServiceStack` | The service's data infrastructure: tables, buckets, queues, topics, user directories |
| `ApiQpqServiceStack` | The api: Lambdas, routes, websockets, api gateway |
| `WebQpqServiceStack` | The website: static hosting and CloudFront |
| `DomainQpqServiceStack` | Dns records for the service |
| `DomainCertificateStack` | ACM certificates, including the us-east-1 ones CloudFront requires |
| `WafCloudFrontWebAclStack` | Web ACLs in front of CloudFront |

Each phase deploys on its own. There are no cross-stack references between them, so a code-only change touches the api stack and leaves the rest alone.

## How names line up

Resource names are derived from the account, region, and config name. The runtime processors derive them exactly the same way, so a Lambda finds its table without anything being passed in at deploy time.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
