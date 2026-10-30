import { SystemShowErrorEffect } from './SystemShowErrorEffect';
import { SystemStartLoadingEffect } from './SystemStartLoadingEffect';
import { SystemStopLoadingEffect } from './SystemStopLoadingEffect';

export type SystemEffects = SystemStartLoadingEffect | SystemStopLoadingEffect | SystemShowErrorEffect;
