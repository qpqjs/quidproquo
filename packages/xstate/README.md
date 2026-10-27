# quidproquo-xstate

[XState](https://stately.ai/docs/xstate) state machines as [quidproquo](https://github.com/qpqjs/quidproquo) actions.

Declare a machine in your config, then drive it from a story the same way you would any other qpq resource. The machine's state is persisted by the runtime, so it survives across invocations instead of living in a single process.

```bash
npm install quidproquo-xstate
```

## The actions

| Action | Does |
| --- | --- |
| `askStateMachineCreate` | Starts a new instance of a declared machine |
| `askStateMachineGet` | Fetches an instance |
| `askStateMachineGetState` | Reads its current state |
| `askStateMachineSendEvent` | Sends an event and gets the resulting state back |

## Why go through actions

A long-running workflow is exactly the kind of thing you want to be able to replay and inspect. Because every transition goes through the runtime as an action, it lands in the execution log with everything else, and a story that drives a machine stays testable with mocked transitions.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
