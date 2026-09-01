// Throwaway resources the smoke tests exercise, one per kind of owned
// resource the service role is granted by tag / name convention (see the
// tag-based IAM grants in quidproquo-deploy-awscdk). Nothing else uses them.
// The store and drive names live in @qpqjs/constants because testa reaches
// them cross-service.
export const SMOKE_PROBE_PARAMETER = 'smokeProbe';
export const SMOKE_PROBE_PARAMETER_VALUE = 'smoke-probe-parameter';
export const SMOKE_PROBE_SECRET = 'smokeProbe';
export const SMOKE_PROBE_EVENT_BUS = 'smokeProbe';

// The queue subscribed to the probe event bus, and the message type that
// flows bus -> queue -> store marker for the event bus test.
export const SMOKE_PROBE_EVENT_QUEUE = 'smokeProbeEvents';
export const SMOKE_PROBE_EVENT_TYPE = 'smokeProbeEvent';
