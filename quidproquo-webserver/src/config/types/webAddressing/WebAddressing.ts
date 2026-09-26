import { ApiAddress } from './ApiAddress';
import { WebAddressingMode } from './WebAddressingMode';
import { WebEntryAddress } from './WebEntryAddress';

/**
 * Baked into every views build so the frontend can address the api, websockets and other web
 * entries without inspecting its own hostname. Subdomain mode carries hosts already resolved
 * by the app's domain resolver, one per root domain; port mode carries the host-side ports.
 */
export type WebAddressing =
  | {
      mode: WebAddressingMode.subdomain;
      // Primary first; every `hosts` array runs in this order.
      rootDomains: string[];
      entries: WebEntryAddress[];
      apis: ApiAddress[];
      webSockets: ApiAddress[];
    }
  | {
      mode: WebAddressingMode.port;
      apiPort: number;
      webSocketPort: number;
      entries: WebEntryAddress[];
    };
