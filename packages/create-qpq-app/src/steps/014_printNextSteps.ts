import { CreateQpqAppStep } from '../types';

export const printNextSteps: CreateQpqAppStep = {
  name: 'Done',

  run: async ({ answers }) => {
    const install = answers.installDependencies ? '' : '  npm install\n  npm run build\n';
    const deployNote = answers.dockerRegistry
      ? `builds the image for ${answers.dockerRegistry} and writes a docker-compose.yml to run it on the host`
      : 'builds the docker image and writes a docker-compose.yml to run it (add a registry in deploy.config.json to push it to another host)';

    console.log(`
Created ${answers.appName}!

Your app has five services (admin, auth, design, shell and todo) and
deploys as a single docker image.

Next steps:

  cd ${answers.appName}
${install}  npm run dev        # api on http://localhost:8080, web on http://localhost:3080
  npm run deploy     # ${deployNote}

Deployments live in apps/${answers.appName}/deploy.config.json (pick one when prompted, or pass --deployment <name>); the domain (${answers.domain}) is each deployment's ROOT_DOMAINS setting there, and the docker host details (registry, publicHost, dataPath) are its platformSettings.
`);
  },
};
