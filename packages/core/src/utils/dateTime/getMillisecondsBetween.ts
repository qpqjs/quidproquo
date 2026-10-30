// Whole milliseconds from one ISO timestamp to another; negative when `endIso` is earlier.
export const getMillisecondsBetween = (startIso: string, endIso: string): number => new Date(endIso).getTime() - new Date(startIso).getTime();
