/** Fetches a built script's text from the temporary URL the host generated; throws with the status when the URL does not serve it. */
export const fetchUserScriptSource = async (sourceUrl: string): Promise<string> => {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`source url answered ${response.status}`);
  }
  return response.text();
};
