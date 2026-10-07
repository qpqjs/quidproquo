/**
 * How long a prompt cache entry should live once written. A request, not a guarantee: each
 * provider maps it onto the lifetimes its models accept. `ProviderDefault` leaves the choice to
 * the provider; the hour costs a dearer write and is only accepted by models that support it.
 */
export enum AiCacheTtl {
  ProviderDefault = 'default',
  FiveMinutes = '5m',
  OneHour = '1h',
}
