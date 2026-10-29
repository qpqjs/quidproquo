/** The wall-clock date, as a qpq iso date time. Platform code hands this to runtimes; stories ask for it with askDateNow. */
export const getDateNow = (): string => new Date().toISOString();
