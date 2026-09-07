/** What a render produced. Only Html is produced today; Css and Blob are modelled ahead of use. */
export enum EventDocRenderKind {
  Html = 'html',
  Css = 'css',
  Blob = 'blob',
}
