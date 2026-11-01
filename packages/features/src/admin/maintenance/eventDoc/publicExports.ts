// Version-pinned public surface: consumers and the doc's own wiring source the LATEST
// version from here. Slices use uniform (un-suffixed) names, so a version bump is just
// repointing these `./vN` paths at the new folder and consumers follow automatically.
// (Adding the new version's bundle to `versions` in maintenanceEventDoc.ts is the separate
// cross-version part.)
export * from './v1/events';
export * from './v1/types';
export * from './v1/views';
