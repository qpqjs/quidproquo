import { Nullable } from '../../types/Nullable';
import { UtcOffset } from '../../types/QpqIsoDateTime';

// Every offset in use lies from -12:00 to +14:00, in whole quarter hours (Nepal is +05:45).
const MIN_OFFSET_MINUTES = -12 * 60;
const MAX_OFFSET_MINUTES = 14 * 60;
const OFFSET_PATTERN = /^([+-])(\d{2}):(\d{2})$/;

/**
 * The minutes an offset adds to UTC ('+09:30' is 570), or null when it is not a real one. The UtcOffset type only checks
 * the shape (`'+99:00'` compiles), so the range and the quarter hours are checked here.
 */
export const getUtcOffsetMinutes = (utcOffset: UtcOffset): Nullable<number> => {
  const match = OFFSET_PATTERN.exec(utcOffset);

  if (!match) {
    return null;
  }

  const [, sign, hours = '', minutes = ''] = match;
  const total = (Number(hours) * 60 + Number(minutes)) * (sign === '-' ? -1 : 1);
  const isQuarterHour = Number(minutes) % 15 === 0 && Number(minutes) < 60;

  return isQuarterHour && total >= MIN_OFFSET_MINUTES && total <= MAX_OFFSET_MINUTES ? total : null;
};
