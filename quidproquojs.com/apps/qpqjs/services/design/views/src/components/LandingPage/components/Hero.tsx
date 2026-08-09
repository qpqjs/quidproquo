import { CodeWindow } from './CodeWindow';
import { InstallChip } from './InstallChip';
import { NavBar } from './NavBar';

export function Hero() {
  return (
    <>
      <NavBar />

      <section className="hero" id="top">
        <div aria-hidden="true" className="hero__grid" />
        <div aria-hidden="true" className="hero__glow" />

        <div className="hero__inner">
          <p className="hero__kicker">functional · action-based · typescript</p>

          <h1 className="hero__title">
            Pure business logic.
            <br />
            <span className="hero__title-dim">Platform agnostic.</span>
          </h1>

          <p className="hero__sub">
            Your logic is a generator function (a <em>story</em>) that yields
            typed actions, never a platform API. A processor per platform
            decides how each action actually runs: Lambda, a container, the
            browser.
          </p>

          <div className="hero__cta">
            <InstallChip />
            <a className="btn btn--ghost" href="#loop">
              See how it works
              <span className="btn__arrow">→</span>
            </a>
          </div>

          <p className="hero__meta">
            <span>MIT licensed</span>
            <span>zero side effects in your logic</span>
            <span>infrastructure from config</span>
          </p>
        </div>

        <div className="hero__panel">
          <CodeWindow />
        </div>
      </section>
    </>
  );
}
