import { useState } from 'react';

import { MaintenanceEditor } from './MaintenanceEditor';
import { MaintenanceList } from './MaintenanceList';

// The Maintenance tab: the list of maintenance event docs, drilling into an
// editor per doc. Creating a new maintenance begins it and opens its editor.
export function Maintenance() {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  if (selectedDocId) {
    return <MaintenanceEditor docId={selectedDocId} onBack={() => setSelectedDocId(null)} />;
  }

  return <MaintenanceList onOpen={setSelectedDocId} />;
}
