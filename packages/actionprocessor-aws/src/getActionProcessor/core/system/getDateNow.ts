// The wall-clock date provider handed to createRuntime for nested story
// executions (stories themselves stay deterministic by asking for it).
export const getDateNow = (): string => new Date().toISOString();
