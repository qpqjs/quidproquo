// Docs live on the docs. subdomain of whatever apex this page is served from
// (minus the views. prefix on federated views); localhost falls back to prod.
const getDocsUrl = (): string => {
  const { hostname, protocol, host } = window.location;

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return 'https://docs.quidproquojs.com';
  }

  return `${protocol}//docs.${host.replace(/^views\./, '')}`;
};

export function NavBar() {
  return (
    <header className="nav">
      <div className="nav__inner">
        <a className="nav__brand" href="#top">
          <svg
            aria-hidden="true"
            className="nav__mark"
            viewBox="24.4 24.4 465.3 465.3"
          >
            <path
              d="M271.42,489.64h-10.72c-128.68,0-235.74-102.93-236.29-231.61S128.97,23.86,258.03,24.41c128.68.55,231.6,107.61,231.6,236.29v11.61c0,.09-.07.16-.16.16h-109.69c-.09,0-.16-.07-.16-.16v-12.61c0-65.9-53.82-123.71-119.7-125.24-69.89-1.62-127.08,55.57-125.46,125.46,1.53,65.89,59.34,119.71,125.24,119.71h11.72c.09,0,.16.07.16.16v109.69c0,.09-.07.16-.16.16Z"
              fill="#22d3ee"
            />
            <rect
              fill="#8df6ff"
              height="106.91"
              width="106.91"
              x="268.31"
              y="273.22"
            />
            <rect
              fill="#8df6ff"
              height="106.91"
              width="106.91"
              x="375.62"
              y="380.53"
            />
          </svg>
          <span className="nav__name">
            quid<span className="nav__name-accent">pro</span>quo
          </span>
        </a>

        <nav className="nav__links">
          <a href="#loop">The loop</a>
          <a href="#stories">Why qpq</a>
          <a href="#packages">Packages</a>
          <a href={getDocsUrl()}>Docs</a>
        </nav>

        <div className="nav__actions">
          <a
            className="btn btn--ghost btn--sm"
            href="https://github.com/qpqjs/quidproquo"
            rel="noreferrer"
            target="_blank"
          >
            <svg
              aria-hidden="true"
              fill="currentColor"
              height="15"
              viewBox="0 0 16 16"
              width="15"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
