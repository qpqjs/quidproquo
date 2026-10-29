import { useState } from 'react';

const INSTALL_COMMAND = 'npx create-qpq-app myapp';

export function InstallChip() {
  const [copied, setCopied] = useState(false);

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable: the command is still visible to copy by hand
    }
  };

  return (
    <button className="install-chip" onClick={copyInstall} type="button">
      <span className="install-chip__prompt">$</span>
      <span className="install-chip__cmd">{INSTALL_COMMAND}</span>
      <span className={`install-chip__copy${copied ? ' is-copied' : ''}`}>{copied ? 'copied' : 'copy'}</span>
    </button>
  );
}
