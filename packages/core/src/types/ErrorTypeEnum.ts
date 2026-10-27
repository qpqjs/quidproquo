// Note: Error enum text may be surfaced to the user
//
export enum ErrorTypeEnum {
  // User failed to provide valid credentials required for accessing this resource
  // ~ typically occurs when user is not authenticated
  Unauthorized = 'Unauthorized',

  // Payment is required to access this resource or perform an action
  PaymentRequired = 'PaymentRequired',

  // User does not have sufficient privileges to access this resource
  Forbidden = 'Forbidden',

  // The requested resource was not found on the server
  NotFound = 'NotFound',

  // The server timed out while waiting for a response from a resource
  TimeOut = 'TimeOut',

  // The request included an unsupported media type or format
  UnsupportedMediaType = 'UnsupportedMediaType',

  // The system or downstream resource is out of resources
  OutOfResources = 'OutOfResources',

  // A generic error occurred that does not fit into a more specific category
  // ~ Think 500 Internal Server Error in a web server
  GenericError = 'GenericError',

  // The requested resource or action has not yet been implemented
  NotImplemented = 'NotImplemented',

  // The requested resource or action was successful, but no content was returned
  NoContent = 'NoContent',

  // The request included invalid data or parameters
  BadRequest = 'BadRequest',

  // The request payload was invalid or in an unsupported format
  Invalid = 'Invalid',

  // The request attempted to create a resource that already exists, or conflicting changes were detected
  Conflict = 'Conflict',
}

export interface QPQError {
  errorType: ErrorTypeEnum | string;
  errorText: string;
  errorStack?: string;
}
