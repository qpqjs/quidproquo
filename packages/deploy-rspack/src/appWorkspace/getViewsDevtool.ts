import type { Configuration } from '@rspack/core';

/**
 * The source-map setting for a views build. Development gets fast inline maps. Production
 * gets none: the whole build directory is published to the website bucket, so a map
 * there would hand the views source tree to anyone who asks for `<script>.map`.
 */
export const getViewsDevtool = (isDev: boolean): Configuration['devtool'] => (isDev ? 'eval-cheap-module-source-map' : false);
