/** How many times a reproject message is tried before it is dead-lettered: a throttled store or a cold fold deserves another go. */
export const EVENT_DOC_REPROJECT_QUEUE_MAX_TRIES = 3;
