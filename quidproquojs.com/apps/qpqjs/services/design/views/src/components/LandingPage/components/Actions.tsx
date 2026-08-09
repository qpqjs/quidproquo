type ActionDomain = {
  domain: string;
  requester: string;
};

// A sample, not the catalogue: enough to show the shape and the reach without
// turning the section into a reference page.
const DOMAINS: ActionDomain[] = [
  { domain: 'key value store', requester: 'askKeyValueStoreGet' },
  { domain: 'file', requester: 'askFileWriteTextContents' },
  { domain: 'queue', requester: 'askQueueSendMessages' },
  { domain: 'event bus', requester: 'askEventBusSendMessages' },
  { domain: 'user directory', requester: 'askUserDirectoryCreateUser' },
  { domain: 'websocket', requester: 'askWebsocketSendMessage' },
  { domain: 'network', requester: 'askNetworkRequest' },
  { domain: 'ai', requester: 'askAiPrompt' },
  {
    domain: 'graph database',
    requester: 'askGraphDatabaseExecuteOpenCypherQuery',
  },
  { domain: 'crypto', requester: 'askCryptoEncrypt' },
  { domain: 'metric', requester: 'askMetricPut' },
  { domain: 'config', requester: 'askConfigGetSecret' },
];

export function Actions() {
  return (
    <section className="section" id="actions">
      <div className="section__head">
        <p className="section__kicker">the surface</p>
        <h2 className="section__title">What a story can ask for</h2>
        <p className="section__sub">
          Every capability is an action with a typed payload and a typed result.
          Each platform supplies its own processor, so the story stays the same
          wherever it runs.
        </p>
      </div>

      <div className="action-grid">
        {DOMAINS.map((entry) => (
          <div key={entry.domain} className="action-cell">
            <span className="action-cell__domain">{entry.domain}</span>
            <code className="action-cell__requester">{entry.requester}</code>
          </div>
        ))}
      </div>

      <p className="action-note">
        25 domains · 91 action types · and your own, when you need one
      </p>
    </section>
  );
}
