import { askDateNow } from '../../actions';
import { AskResponse, AskResponseReturnType } from '../../types';

export function* askSecondsElapsedFrom(
  startTime: AskResponseReturnType<ReturnType<typeof askDateNow>>,
  endTime?: AskResponseReturnType<ReturnType<typeof askDateNow>>,
): AskResponse<number> {
  const currentDateTime = endTime || (yield* askDateNow());

  // Convert both ISO datetime strings to Date objects.
  const startDate = new Date(startTime);
  const currentDate = new Date(currentDateTime);

  // Calculate the difference in seconds between the two timestamps.
  const secondsElapsed = (currentDate.getTime() - startDate.getTime()) / 1000;

  return secondsElapsed;
}
