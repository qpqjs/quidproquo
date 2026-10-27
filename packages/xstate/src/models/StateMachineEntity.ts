/**
 * An entity managed by a state machine: the caller's item plus the entity id and,
 * under the configured stateField, the persisted xstate snapshot.
 */
export type StateMachineEntity = { id: string } & Record<string, unknown>;
