# quidproquo-actionprocessor-awslambda

The AWS runtime for [quidproquo](https://github.com/qpqjs/quidproquo).

A qpq story yields actions, and a **processor** is the function that actually carries one out. This package maps the qpq action catalogue onto AWS services, and supplies the Lambda handlers that turn an AWS event into a story execution.

You do not usually install this yourself. It arrives as a dependency of `quidproquo-deploy-awscdk` and the CLI.

## Actions to services

| Action domain | AWS service |
| --- | --- |
| `keyValueStore` | DynamoDB |
| `file` | S3 |
| `userDirectory` | Cognito |
| `queue` | SQS |
| `eventBus` | SNS |
| `email` | SES v2 |
| `config` | SSM Parameter Store and Secrets Manager |
| `crypto` | KMS |
| `ai` | Bedrock |
| `graphDatabase` | Neptune, over openCypher |
| `metric` | CloudWatch, written as embedded metric format log lines rather than api calls |

Everything platform-neutral (dates, guids, http, logging) comes from `quidproquo-actionprocessor-js`, and the Node-specific pieces from `quidproquo-actionprocessor-node`.

## Lambda entry points

The handlers in `src/lambdas/` are the other half of the package. Each one adapts a specific AWS event into a story run: API Gateway requests and websocket frames, CloudFront viewer and origin requests, S3 object events, SQS messages, DynamoDB streams, EventBridge schedules and deploy hooks, and the Cognito trigger set for custom auth flows.

There is also a dynamic module loader, which lets a Lambda pull the service's business logic at runtime instead of baking it into the deployment package. That keeps functions warm across deploys and makes rollbacks close to instant.

## Naming and config

`awsNamingUtils` derives every resource name from the account, region, and qpq config, so names are consistent between what the CDK package creates and what the processors look up at runtime. Nothing needs to be passed by hand between the two.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
