import { OpenApiInfo } from '../../types/OpenApiDocument';

// The parts of the document that are prose rather than derived from the routes.
// Every field falls back to something sensible taken from the service config.
export type OpenApiDocumentOptions = Partial<OpenApiInfo>;
