export function constructUrlWithParams(baseUrl: string, params: Record<string, string>) {
  const url = new URL(baseUrl);
  Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));

  return url.toString();
}
