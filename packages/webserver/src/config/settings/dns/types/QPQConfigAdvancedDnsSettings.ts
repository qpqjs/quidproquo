import { QpqPureFunction } from '@qpqjs/core';

export type QPQConfigAdvancedDnsSettings = {
  // Pointer to the app's DomainResolver export (a pure function, no actions).
  resolver?: QpqPureFunction;
};
