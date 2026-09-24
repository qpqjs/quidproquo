// The data on every event a smoke writer appends: the number it contributes to the
// document, and which run and writer produced it. The document folds the numbers;
// the tests read them back to prove every writer's every event landed exactly once.
export type SmokeEventDocMark = {
  value: number;
  runId: string;
  writerId: number;
};
