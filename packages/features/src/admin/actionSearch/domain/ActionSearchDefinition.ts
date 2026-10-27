import { ActionSearchActionDefinition } from './ActionSearchActionDefinition';
import { ActionSearchEntityDefinition } from './ActionSearchEntityDefinition';

export type ActionSearchDefinition = {
  action: ActionSearchActionDefinition;
  entity?: ActionSearchEntityDefinition;
};
