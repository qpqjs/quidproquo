/** How a frontend reaches the app's other origins: one host per subdomain (AWS) or one host on several ports (dev server, docker). */
export enum WebAddressingMode {
  subdomain = 'subdomain',
  port = 'port',
}
