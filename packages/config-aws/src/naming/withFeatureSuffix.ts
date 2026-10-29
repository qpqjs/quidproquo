// Appends the feature segment to a name only when the deployment has one. Every name that
// carries the deployment identity joins its feature through here.
export const withFeatureSuffix = (baseName: string, feature?: string, separator: string = '-'): string =>
  feature ? `${baseName}${separator}${feature}` : baseName;
