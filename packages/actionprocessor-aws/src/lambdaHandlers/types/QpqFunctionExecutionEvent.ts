import { SNSEvent } from 'aws-lambda';

/**
 * What a qpq lambda can actually receive: its own trigger's event type, or an
 * SNS event, because every lambda is also subscribed to the bootstrap warmer
 * topic (see isSnsWarmerRecord / getQpqLambdaRuntimeForEvent).
 */
export type QpqFunctionExecutionEvent<T> = SNSEvent | T;
