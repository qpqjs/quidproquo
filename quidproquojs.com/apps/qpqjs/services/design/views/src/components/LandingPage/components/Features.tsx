import type { ReactNode } from 'react';

type Feature = {
  icon: ReactNode;
  title: string;
  body: string;
};

const iconProps = {
  viewBox: '0 0 24 24',
  width: 22,
  height: 22,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const FEATURES: Feature[] = [
  {
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <path d="M12 5.5C10.4 4 8 3.5 4 3.5v15c4 0 6.4.5 8 2 1.6-1.5 4-2 8-2v-15c-4 0-6.4.5-8 2Z" />
        <path d="M12 5.5v15" />
      </svg>
    ),
    title: 'Pure stories',
    body: 'Business logic is a generator function that yields actions. No SDK calls, no mocks to untangle. Just intent, in order, readable top to bottom.',
  },
  {
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8Z" />
      </svg>
    ),
    title: 'Typed actions',
    body: 'Every side effect (files, queues, auth, websockets, AI) is a typed action with a typed result. The compiler knows exactly what your story can do.',
  },
  {
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 13 9 5 9-5" />
      </svg>
    ),
    title: 'Swappable runtimes',
    body: 'Action processors implement the how per platform. The same story executes on Lambda, Node, or in the browser without changing a line.',
  },
  {
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <path d="M19.4 17.5A4.5 4.5 0 0 0 18 9a6 6 0 0 0-11.7 1.6A4 4 0 0 0 6.5 18" />
        <path d="M12 20.5v-7m0 0-3 3m3-3 3 3" />
      </svg>
    ),
    title: 'Config-driven deploys',
    body: 'Describe queues, stores and routes in QPQ config. The CDK package turns it into real AWS infrastructure, with no hand-written stacks.',
  },
];

export function Features() {
  return (
    <section className="section" id="stories">
      <div className="section__head">
        <p className="section__kicker">why qpq</p>
        <h2 className="section__title">One story. Every runtime.</h2>
        <p className="section__sub">
          Separate the <em>what</em> from the <em>how</em>, and the how becomes
          replaceable.
        </p>
      </div>

      <div className="feature-grid">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="feature-card">
            <span className="feature-card__icon">{feature.icon}</span>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
