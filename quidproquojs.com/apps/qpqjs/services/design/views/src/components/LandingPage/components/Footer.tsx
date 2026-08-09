import { InstallChip } from './InstallChip';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__cta">
        <p className="section__kicker">get started</p>
        <h2 className="footer__cta-title">Write your first story</h2>
        <p className="footer__cta-sub">
          One command scaffolds a full app: five services, a local dev server
          and a one-image docker deploy. Yield an action, and the runtime takes
          it from there.
        </p>
        <div className="footer__cta-actions">
          <InstallChip />
          <a
            className="btn btn--ghost"
            href="https://github.com/qpqjs/quidproquo"
            rel="noreferrer"
            target="_blank"
          >
            Star on GitHub
          </a>
        </div>
      </div>

      <div className="footer__base">
        <div className="footer__base-inner">
          <span>quidproquo · MIT license</span>
          <span>built as a qpq story, naturally</span>
        </div>
      </div>
    </footer>
  );
}
