import { BaseUrlContext } from './BaseUrlContext';
import { BaseUrlResolvers } from './types';

export type BaseUrlContextProps = {
  children: React.ReactNode;
  urlResolvers: BaseUrlResolvers;
};

export const BaseUrlProvider: React.FC<BaseUrlContextProps> = ({ children, urlResolvers }) => {
  return <BaseUrlContext.Provider value={urlResolvers}>{children}</BaseUrlContext.Provider>;
};
