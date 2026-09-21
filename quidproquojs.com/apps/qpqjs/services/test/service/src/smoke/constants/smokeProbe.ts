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

// Scoped probe resources: every call must carry a scope, an unscoped one is
// refused. Only the test service uses them, so they stay service-level.
export const SMOKE_SCOPED_PROBE_STORE = 'smokeScopedProbe';
export const SMOKE_SCOPED_PROBE_DRIVE = 'smoke-scoped-probe';

// The file event drives: an unscoped and a scoped one, both with create and
// delete handlers that write a marker row the file event test polls for.
export const SMOKE_FILE_EVENT_DRIVE = 'smoke-file-event';

// A scoped store with a change stream; the handler writes a marker row the
// kvs stream test polls for.
export const SMOKE_STREAM_PROBE_STORE = 'smokeStreamProbe';

// The crypto key the encrypted probe drive and store name: proves the
// alias-conditioned KMS grant lets the service role write and read data
// encrypted with a defineCryptoKey. Not 'smokeProbe': the signing key of that
// name is a KMS alias too, and the two would collide.
export const SMOKE_CRYPTO_KEY = 'smokeCrypto';
export const SMOKE_ENCRYPTED_PROBE_STORE = 'smokeEncryptedProbe';
export const SMOKE_ENCRYPTED_PROBE_DRIVE = 'smoke-encrypted-probe';

// Inbound email: the receiver's onEmail writes a marker the email test polls for.
// Deployed only.
export const SMOKE_EMAIL_RECEIVER = 'smoke';
