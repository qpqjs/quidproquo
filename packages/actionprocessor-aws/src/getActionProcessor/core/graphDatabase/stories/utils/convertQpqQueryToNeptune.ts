// Neptune: Replace qpqElementId(n) with n.`~id`
export function convertQpqQueryToNeptune(query: string): string {
  return query.replace(/qpqElementId\((.*?)\)/g, '$1.`~id`');
}
