import { defineSmokeReport } from '@qpqjs/service-utils';
import { QPQConfig } from 'quidproquo';

/** The smoke report, owned here: this deploy creates its bus, its month document stores and the queue that folds into them. */
export const defineReportsSmoke = (): QPQConfig => defineSmokeReport();
