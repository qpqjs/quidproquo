import { QPQ_PACKAGE_SCOPE } from '../../constants/qpqPackageScope';

/** Whether an npm package name is a framework package an app can depend on: anything under the @qpqjs scope, or the `quidproquo` umbrella. */
export const isQpqPackageName = (name: string): boolean => name === 'quidproquo' || name.startsWith(`${QPQ_PACKAGE_SCOPE}/`);
