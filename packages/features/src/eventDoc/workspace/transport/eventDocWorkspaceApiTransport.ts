import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceApiAppendEvent } from './askEventDocWorkspaceApiAppendEvent';
import { askEventDocWorkspaceApiFetchBootstrap } from './askEventDocWorkspaceApiFetchBootstrap';
import { askEventDocWorkspaceApiFetchEvents } from './askEventDocWorkspaceApiFetchEvents';
import { askEventDocWorkspaceApiFetchEventsPage } from './askEventDocWorkspaceApiFetchEventsPage';

/** The standard transport over askApiRequest; hosts without an api request processor inject their own. */
export const eventDocWorkspaceApiTransport: EventDocWorkspaceTransport = {
  askFetchBootstrap: askEventDocWorkspaceApiFetchBootstrap,
  askFetchEvents: askEventDocWorkspaceApiFetchEvents,
  askFetchEventsPage: askEventDocWorkspaceApiFetchEventsPage,
  askAppendEvent: askEventDocWorkspaceApiAppendEvent,
};
