import { CreateQpqAppStep } from '../types';

export const printNextSteps: CreateQpqAppStep = {
  name: 'Done',

  run: async ({ answers }) => {
    const install = answers.installDependencies ? '' : '  npm install\n  npm run build\n';

    console.log(`
Created ${answers.appName}!

Your app has five services (admin, auth, design, shell and todo) and
deploys as a single docker image.

Next steps:

  cd ${answers.appName}
${install}  npm run dev        # api on http://localhost:8080, web on http://localhost:3080
  npm run deploy     # build the docker image (then run the printed docker command)

Deployments live in apps/${answers.appName}/deploy.config.json (pick one when prompted, or pass --deployment <name>); the domain (${answers.domain}) is each deployment's ROOT_DOMAINS setting there.
`);
  },
};
