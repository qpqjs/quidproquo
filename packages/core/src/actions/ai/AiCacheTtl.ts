/**
 * How long a prompt cache entry should live once written. A request, not a guarantee: each
 * provider maps it onto the lifetimes its models accept. `Dynamic` lets the provider pick the
 * best lifetime for each cache point; `ProviderDefault` leaves every point on the provider's own
 * default; the hour costs a dearer write and is only accepted by models that support it.
 */
export enum AiCacheTtl {
  Dynamic = 'dynamic',
  ProviderDefault = 'default',
  FiveMinutes = '5m',
  OneHour = '1h',
}
