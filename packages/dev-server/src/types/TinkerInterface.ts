import { QPQConfig, Story, StoryResult } from 'quidproquo-core';

export interface TinkerOptions {
  initialService?: string;
  includeHttpServer?: boolean;
  editorMode?: boolean; // Start in editor mode by default
}

export interface TinkerInterface {
  run: <TArgs extends Array<any>, TReturn>(story: Story<TArgs, TReturn>, args?: TArgs) => Promise<StoryResult<TArgs, TReturn>>;
  switchService: (serviceName: string) => void;
  getCurrentService: () => string;
  getServices: () => string[];
  startRepl: () => void;
  getServiceConfig: () => QPQConfig;
}
