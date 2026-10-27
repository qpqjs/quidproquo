import { EventDocStatus } from '../../../eventDoc/models/EventDocStatus';
import { MaintenanceLevel } from './v1/types/MaintenanceLevel';
import { MaintenanceState } from './v1/views/document/MaintenanceState';

// THE public-visibility rule, used by both the active-set builder (broadcast +
// connect-time sync) and the onAppend broadcast-skip: users may know about a
// maintenance only while it is an OPEN DRAFT that has ANNOUNCED something (at
// least one update) at a non-Internal level. Anything Internal — including one
// that closes while Internal — never reaches a user surface, now or in any
// future public history.
export const isMaintenancePubliclyVisible = (state: MaintenanceState): boolean =>
  state.status === EventDocStatus.Draft && state.updates.length > 0 && state.level !== MaintenanceLevel.Internal;
