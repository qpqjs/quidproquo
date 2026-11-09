import { addDaysToTDateIso } from '@qpqjs/core';

/** The calendar day (`YYYY-MM-DD`) `days` after `day`. A plain day parses as UTC midnight, so no clock change applies. */
export const addReportDays = (day: string, days: number): string => addDaysToTDateIso(day, days).slice(0, 10);
