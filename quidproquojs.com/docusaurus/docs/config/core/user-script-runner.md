---
title: defineUserScriptRunner
description: Declare the sandbox a service runs its user scripts in, a separate function with no resource access and only the pure action processors.
---

# defineUserScriptRunner

Declares the sandbox that runs this service's user scripts. [askUserScriptExecute](../../actions/core/user-script/ask-user-script-execute.md) hands the built script to it instead of running the script inside the calling function. One per service.

The sandbox is two walls:

- **No permissions.** The runner is its own function with its own role, which can write logs and nothing else. It never uses the service role, so it cannot reach a drive, a store, a secret or a queue even if a script tries.
- **Pure actions only.** The runner's action processors are date, guid, log, math and error. A script can yield `askDateNow` or `askNewGuid`, and its story runs as usual. Anything else it yields has no processor and fails at that point.

```typescript
import { defineUserScriptRunner } from 'quidproquo-core';

export default [
  defineUserScriptRunner({ timeoutInSeconds: 30, memoryInMiB: 512 }),
];
```

- **On AWS:** deploys one Lambda function with a dedicated role. The service role gains permission to invoke exactly that function.
- **Dev server:** runs each script in a child process (a second bundle `qpq go:dev:api` builds beside the server) with no cloud credentials in its environment and the same timeout, so a script that works locally works deployed and the other way round.

## Signature

```typescript
function defineUserScriptRunner(options?: UserScriptRunnerOptions): UserScriptRunnerQPQConfigSetting;
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `timeoutInSeconds` | `number` | `60` | How long one script call may run. A whole number from 1 to 900. |
| `memoryInMiB` | `number` | `512` | Memory for one script call. A whole number from 128 to 10240. |
| `maxConcurrentExecutions` | `number` | none | Cap on scripts running at once, carved out of the account's shared concurrency pool. |
| `virtualNetworkName` | `string` | none | Put the runner in this [virtual network](./virtual-network.md). One with no route out denies scripts the internet. |

## Notes

- The script reaches the runner as a temporary read URL for the built file, so the runner needs no drive access and the service's drive permissions stay with the service.
- Each call runs in a fresh child process inside the runner, so nothing a script leaves behind is visible to the next call.
- A service that calls `askUserScriptExecute` without declaring a runner gets `RunnerUnavailable` from the call, naming this define.
- Letting a script reach the service's own resources through host-provided actions is a later step; see [defineUserScriptModule](./user-script-module.md) for what a script can import today.

## Related

- [askUserScriptExecute](../../actions/core/user-script/ask-user-script-execute.md)
- [askUserScriptBuild](../../actions/core/user-script/ask-user-script-build.md)
- [defineUserScriptModule](./user-script-module.md)
