import { Nullable } from 'quidproquo-core';

// The ETA time blocks offered in the create dialog and editor. null = unknown
// (no ETA shown to users). The chosen duration anchors to the SET_ETA event's
// server timestamp, so re-picking a block always restarts the clock.
export type EtaOption = {
  label: string;
  etaDurationMins: Nullable<number>;
};

export const etaOptions: EtaOption[] = [
  { label: 'Unknown', etaDurationMins: null },
  { label: '5 mins', etaDurationMins: 5 },
  { label: '15 mins', etaDurationMins: 15 },
  { label: '30 mins', etaDurationMins: 30 },
  { label: '60 mins', etaDurationMins: 60 },
  { label: '2 hours', etaDurationMins: 120 },
  { label: '3 hours', etaDurationMins: 180 },
  { label: '6 hours', etaDurationMins: 360 },
];
