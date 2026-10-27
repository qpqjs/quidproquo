/** The body of a markdown file's `## <heading>` section, up to the next `## ` heading (`###` subheadings stay in), or null when there is no such heading. */
export const readMarkdownSection = (markdown: string, heading: string): string | null => {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);

  if (start === -1) {
    return null;
  }

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('## '));

  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();
};
