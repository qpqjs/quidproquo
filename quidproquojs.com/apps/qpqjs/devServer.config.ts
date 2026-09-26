import { DevServerConfigOverrides } from 'quidproquo-dev-server';

// App-level dev server settings. The ports are the same locally and inside the docker image,
// so a url that works against `npm run dev` works against the deployed container too.
const devServerConfig: DevServerConfigOverrides = {
  ports: {
    api: 8080,
    webSocket: 8888,
    fileStorage: 3001,
  },
};

export default devServerConfig;
