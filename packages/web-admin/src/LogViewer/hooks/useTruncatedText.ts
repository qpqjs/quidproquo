export const useTruncatedText = (text?: string) => {
  const safeText = text || '';

  const canTruncate = safeText.split('\n').length > 3;
  const truncatedText = safeText.split('\n').slice(0, 3).join('\n') + '...';

  const handleCopy = () => {
    navigator.clipboard.writeText(safeText);
  };

  return { canTruncate, truncatedText, handleCopy };
};
