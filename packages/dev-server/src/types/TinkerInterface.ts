import { QPQConfig, Story, StoryResult } from '@qpqjs/core';

export type TinkerOptions = {
  initialService?: string;
  includeHttpServer?: boolean;
  editorMode?: boolean; // Start in editor mode by default
};

export type TinkerInterface = {
  run: <TArgs extends Array<any>, TReturn>(story: Story<TArgs, TReturn>, args?: TArgs) => Promise<StoryResult<TArgs, TReturn>>;
  switchService: (serviceName: string) => void;
  getCurrentService: () => string;
  getServices: () => string[];
  startRepl: () => void;
  getServiceConfig: () => QPQConfig;
};
