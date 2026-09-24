// The store the tick schedule writes its heartbeat into. Local to this
// service: unlike the smoke probe resources, nothing cross-service reaches it.
export const SCHEDULE_TICK_STORE = 'scheduleTick';
