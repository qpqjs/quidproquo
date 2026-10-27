// The values keep their historical '@quidproquo-core' prefix even though this
// enum lives in quidproquo-xstate: they are wire-visible in stored story logs,
// and renaming them would break existing traces and consumers matching on the
// string.
export enum StateMachineActionType {
  Create = '@quidproquo-core/StateMachine/Create',
  Get = '@quidproquo-core/StateMachine/Get',
  GetState = '@quidproquo-core/StateMachine/GetState',
  SendEvent = '@quidproquo-core/StateMachine/SendEvent',
}
