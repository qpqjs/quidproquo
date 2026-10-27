export enum InvalidScheduleRecurrenceErrorCode {
  UnknownRecurrence = 'UnknownRecurrence',
  IntervalDoesNotDivideEvenly = 'IntervalDoesNotDivideEvenly',
  ValueOutOfRange = 'ValueOutOfRange',
}

/**
 * A recurrence that cannot be scheduled.
 *
 * Thrown from `resolveScheduleFields`, which `defineRecurringSchedule` calls,
 * so a bad schedule fails while the config is being evaluated - at synth AND
 * at dev-server boot - rather than at deploy or, worse, silently at the wrong
 * time of day.
 *
 * A named subclass with a code rather than a bare Error, so a caller can tell
 * these apart from anything else that went wrong while loading config.
 */
export class InvalidScheduleRecurrenceError extends Error {
  readonly code: InvalidScheduleRecurrenceErrorCode;

  constructor(code: InvalidScheduleRecurrenceErrorCode, message: string) {
    super(message);

    this.name = 'InvalidScheduleRecurrenceError';
    this.code = code;
  }
}
