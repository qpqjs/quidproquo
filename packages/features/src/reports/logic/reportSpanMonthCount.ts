/** How many calendar months a span of local days touches, worked out without listing them, so an overlong span is cheap to refuse. */
export const reportSpanMonthCount = (from: string, to: string): number =>
  Number(to.slice(0, 4)) * 12 + Number(to.slice(5, 7)) - (Number(from.slice(0, 4)) * 12 + Number(from.slice(5, 7))) + 1;
