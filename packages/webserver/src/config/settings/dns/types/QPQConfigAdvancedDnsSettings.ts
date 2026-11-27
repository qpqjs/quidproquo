import { QpqPureFunction } from '@qpqjs/core';

export type QPQConfigAdvancedDnsSettings = {
  // Pointer to the app's DomainResolver export (a pure function, no actions).
  resolver?: QpqPureFunction;

  /**
   * Only for an app first deployed before each root's resources were named after the root.
   *
   * Back then the first root's resources were deployed under unsuffixed names. Set this to that
   * root so those resources keep their names; every other root is named after itself wherever it
   * sits in the list. The root may be reordered or dropped from the list. Keep the setting for as
   * long as the app declares an email sender, whose resources are grouped under this root's name.
   *
   * An app deployed for the first time on this version or later must not set it.
   *
   * TODO: remove for version 1 of quidproquo. Every app must be off the unsuffixed names by then.
   */
  legacyUnsuffixedRootDomain?: string;
};
