type PackageGroup = {
  label: string;
  packages: string[];
};

const GROUPS: PackageGroup[] = [
  {
    label: 'core',
    packages: ['quidproquo-core', 'quidproquo-webserver'],
  },
  {
    label: 'action processors',
    packages: [
      'quidproquo-actionprocessor-awslambda',
      'quidproquo-actionprocessor-node',
      'quidproquo-actionprocessor-web',
    ],
  },
  {
    label: 'deploy',
    packages: [
      'quidproquo-config-aws',
      'quidproquo-deploy-awscdk',
      'quidproquo-deploy-webpack',
    ],
  },
  {
    label: 'client',
    packages: [
      'quidproquo-web',
      'quidproquo-web-react',
      'quidproquo-web-admin',
    ],
  },
];

export function Packages() {
  return (
    <section className="section" id="packages">
      <div className="section__head">
        <p className="section__kicker">packages</p>
        <h2 className="section__title">A package for every layer</h2>
        <p className="section__sub">
          Every layer is its own package, so you only pull in what you need.
        </p>
      </div>

      <div className="package-groups">
        {GROUPS.map((group) => (
          <div key={group.label} className="package-group">
            <span className="package-group__label">{group.label}</span>
            <div className="package-group__chips">
              {group.packages.map((name) => (
                <code key={name} className="package-chip">
                  {name}
                </code>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
