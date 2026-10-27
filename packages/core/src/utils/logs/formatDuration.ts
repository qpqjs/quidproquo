export function formatDuration(ms: number): string {
  // Round to whole seconds first, then split: rounding the remainder on its own
  // could produce "1m 60s" for anything just under the next minute.
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const minutesPart = minutes > 0 ? `${minutes}m ` : '';
  const secondsPart = `${seconds}s`;

  return `${minutesPart}${secondsPart}`.trim();
}
