import { askProcessOnError } from './askProcessOnError';
import { askProcessOnThrottle } from './askProcessOnThrottle';
import { askProcessOnTimeout } from './askProcessOnTimeout';

export const notifyErrorLogic = {
  askProcessOnError,
  askProcessOnTimeout,
  askProcessOnThrottle,
};
