// NOTE:  The following actions have no platform specific processors and/or requestors
//        and therefore do not need to implement a SystemActionProcessor.ts
//
// * SystemActionType.Batch
//

export enum SystemActionType {
  Batch = '@quidproquo-core/System/Batch',
  ExecuteStory = '@quidproquo-core/System/ExecuteStory',
  GetRuntimeCorrelation = '@quidproquo-core/System/GetRuntimeCorrelation',
  GetRuntimeRemainingTime = '@quidproquo-core/System/GetRuntimeRemainingTime',

  // Only node runtimes implement a processor (V8-inspector based log replay tracing)
  TraceStory = '@quidproquo-core/System/TraceStory',

  // This isn't needed as its just a hybrid runtime method for SystemBatch
  // RunParallel = '@quidproquo-core/System/RunParallel',
}
