---
title: defineDeployEvent
description: Define a deploy event — a hook story that runs at deploy time when the service's CloudFormation stacks change state.
---

# defineDeployEvent

Defines a **deploy event**: a lifecycle hook story that runs at **deploy time** rather than in response to a request. It fires when the service's infrastructure stacks finish creating, updating, or deleting — the place for deploy-time work like seeding data, running migrations, warming caches, or notifying an external system that a new version is live. Like the other event sources it delivers its event through the [askProcessEvent](../../actions/core/event/ask-process-event.md) pipeline.

- **On AWS:** deploys a **Lambda** plus an **EventBridge rule** matching `aws.cloudformation` "CloudFormation Stack Status Change" events (`QpqCoreDeployEventConstruct` in `@qpqjs/deploy-aws`). On every stack status change the rule invokes the Lambda; the processor resolves which of the service's stacks changed (mapping it to `Api`, `Web`, or `Unknown`) and the completion status (`Create`, `Update`, `Delete`, or `Unknown`), then runs your story with that `DeployEvent`. The Lambda has a 15-minute timeout.

```typescript
import { defineDeployEvent } from '@qpqjs/core';

export default [
  defineDeployEvent('on-deploy', '/entry/deploy/onDeploy::onDeploy'),
];
```

## Signature

```typescript
function defineDeployEvent(
  name: string,
  runtime: QpqFunctionRuntime,
): DeployEventsQPQConfigSetting;
```

## Parameters

### `name` — `string` (required)

The name of the deploy event. This is its `uniqueKey`, and on AWS it derives the handler Lambda's name. It is also passed to the handler Lambda (as `deployEventConfigName`) so the runtime can resolve which deploy-event config it belongs to.

### `runtime` — `QpqFunctionRuntime` (required)

The story to run on each qualifying stack status change. Usually a relative path string of the form `'/path/to/file::exportedFunctionName'`. This story's entry point is registered as a build source.

## The delivered event: `DeployEvent`

The handler story receives a `DeployEvent` describing what changed:

```typescript
export enum DeployEventType {
  Unknown = 'Unknown',
  Api = 'Api',
  Web = 'Web',
}

export enum DeployEventStatusType {
  Unknown = 'Unknown',
  Update = 'Update',
  Create = 'Create',
  Delete = 'Delete',
}

export type DeployEvent = {
  deployEventType: DeployEventType;      // which stack changed (Api / Web / Unknown)
  deployEventStatusType: DeployEventStatusType; // Create / Update / Delete / Unknown
};

export type DeployEventResponse = void;
```

Because the underlying rule fires on **every** stack status change, guard your logic on these fields — for example, only seed data when `deployEventType === DeployEventType.Api` and `deployEventStatusType === DeployEventStatusType.Create`.

```typescript
import { DeployEvent, DeployEventType, DeployEventStatusType } from '@qpqjs/core';

export function* onDeploy(event: DeployEvent) {
  if (event.deployEventType === DeployEventType.Api && event.deployEventStatusType === DeployEventStatusType.Create) {
    // first-time API deploy: seed reference data
  }
}
```

## Examples

```typescript
import { defineDeployEvent } from '@qpqjs/core';

export default [
  // Run migrations / seeding after each deploy
  defineDeployEvent('post-deploy-migrations', '/entry/deploy/onDeployMigrate::onDeployMigrate'),
];
```

## Related

- [askProcessEvent](../../actions/core/event/ask-process-event.md) — the pipeline that runs the handler story for the delivered `DeployEvent`.
- [defineRecurringSchedule](./recurring-schedule.md) — a related time-based trigger that runs a story on a cron timetable rather than at deploy time.
- [defineMigration](../webserver/migration.md) — a webserver helper built on this hook that runs data migrations once per deploy.
- [defineSeed](../webserver/seed.md) — a webserver helper built on this hook that seeds initial data on the first deploy.
- **AWS implementation:** `QpqCoreDeployEventConstruct` (handler Lambda + CloudFormation EventBridge rule) in `@qpqjs/deploy-aws`.
