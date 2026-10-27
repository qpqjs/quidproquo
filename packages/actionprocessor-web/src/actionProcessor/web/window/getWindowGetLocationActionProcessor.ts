import { actionResult, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';
import { askWindowGetLocation, WindowActionType } from 'quidproquo-web';

const getProcessWindowGetLocation = (qpqConfig: QPQConfig): ProcessorFor<typeof askWindowGetLocation> => {
  return async () => {
    const { href, origin, protocol, host, hostname, port, pathname, search, hash } = window.location;

    // Return a plain serializable copy, never the live Location object.
    return actionResult({ href, origin, protocol, host, hostname, port, pathname, search, hash });
  };
};

export const getWindowGetLocationActionProcessor = createActionProcessor(askWindowGetLocation, getProcessWindowGetLocation);
