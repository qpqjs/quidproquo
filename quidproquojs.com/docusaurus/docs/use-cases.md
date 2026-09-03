---
sidebar_position: 3
---

# Use Cases

Quidproquo is designed to excel in scenarios where platform flexibility, observability, and maintainability are critical. Here are the key use cases where Quidproquo provides exceptional value.

## Microservices Architecture

Quidproquo brings consistency and observability to microservice architectures, addressing common challenges teams face when building distributed systems.

### Benefits for Microservices

**Consistent Patterns Across Services**
- Every service uses the same action/story pattern
- Shared action types ensure consistent interfaces
- Reusable stories can be packaged and shared between services
- Standardized error handling and logging across all services

**Service Interconnection Made Simple**
```typescript
function* processPayment(orderId: string) {
  // Call another service through actions
  const inventory = yield* askServiceFunction('inventory-service', 'checkStock', { orderId });
  const payment = yield* askServiceFunction('payment-service', 'charge', { orderId });
  
  // Automatic correlation IDs track requests across services
  yield* askEventBusSendMessage('order-processed', { orderId, inventory, payment });
}
```

**Complete Distributed Tracing**
- Every action is logged with correlation IDs
- Trace requests across multiple services
- Understand the complete flow of a user request
- Debug production issues by replaying the exact sequence

**Independent Deployment**
- Services can be deployed to different platforms
- Mix serverless and containerized services
- Gradual migration from monolith to microservices
- A/B testing at the service level

### Real-World Example: E-Commerce Platform

```typescript
// Order Service
function* createOrder(userId: string, items: Item[]) {
  // Validate inventory across multiple warehouses
  const availability = yield* askServiceFunction('inventory', 'checkMultiWarehouse', items);
  
  // Calculate pricing with discounts
  const pricing = yield* askServiceFunction('pricing', 'calculate', { userId, items });
  
  // Create order record
  const order = yield* askKeyValueStoreUpsert('orders', {
    userId,
    items,
    pricing,
    status: 'pending'
  });
  
  // Trigger async processing
  yield* askQueueSendMessage('order-processing', order);
  
  return order;
}
```

## Serverless Applications

Quidproquo is perfectly suited for serverless architectures, abstracting away the complexities of different cloud providers while maintaining the benefits.

### Serverless Benefits

**Cloud Provider Independence**
- Deploy the same code to AWS Lambda, Google Cloud Functions, or Azure Functions
- Switch providers without code changes
- Multi-cloud deployments for redundancy
- Avoid vendor lock-in

**Local Development Excellence**
```bash
# Run your entire serverless app locally
npm run dev-server

# Full local simulation of:
# - Lambda functions
# - API Gateway
# - DynamoDB
# - S3
# - SQS/SNS
# - Cognito
```

**Cold Start Optimization**
- Minimal runtime overhead
- Lazy loading of action processors
- Shared lambda layers for common code
- Warm-up strategies built into the framework

**Cost Optimization**
- Deploy compute-intensive functions to containers
- Keep simple functions on Lambda
- Use the most cost-effective platform for each workload
- Monitor and optimize based on actual usage patterns

### Real-World Example: Image Processing Pipeline

```typescript
// Triggered by S3 upload
function* processImage(bucket: string, key: string) {
  // Read image from S3
  const imageData = yield* askFileReadBinaryContents(bucket, key);
  
  // Generate thumbnails (runs on Lambda)
  const thumbnails = yield* askServiceFunction('image-processor', 'generateThumbnails', imageData);
  
  // Store thumbnails
  yield* askBatch(
    thumbnails.map(thumb => 
      askFileWriteBinaryContents(`${bucket}-thumbnails`, `${key}-${thumb.size}`, thumb.data)
    )
  );
  
  // Trigger AI analysis (runs on GPU-enabled container)
  yield* askQueueSendMessage('ai-analysis', { bucket, key });
  
  // Update database
  yield* askKeyValueStoreUpdate('images', key, {
    processed: true,
    thumbnails: thumbnails.map(t => t.size)
  });
}
```

## API Development

Build robust, well-documented APIs with built-in validation, authentication, and monitoring.

### API Development Benefits

**Declarative Route Definitions**
```typescript
export const api = createApi({
  routes: {
    'GET /users/:id': getUserStory,
    'POST /users': createUserStory,
    'PUT /users/:id': updateUserStory,
    'DELETE /users/:id': deleteUserStory
  },
  middleware: [authenticate, validate, rateLimit]
});
```

**Built-in Authentication & Authorization**
```typescript
function* protectedRoute(request: HTTPRequest) {
  // Automatic token validation
  const user = yield* askUserDirectoryDecodeAccessToken(request.headers.authorization);
  
  // Role-based access control
  if (!user.roles.includes('admin')) {
    return { statusCode: 403, body: 'Forbidden' };
  }
  
  // Proceed with business logic
  const data = yield* askKeyValueStoreGet('sensitive-data', request.params.id);
  return { statusCode: 200, body: data };
}
```

**Request/Response Transformation**
- Automatic serialization/deserialization
- Response compression
- CORS handling
- Rate limiting and throttling

## Event-Driven Systems

Perfect for building reactive, event-driven architectures with complex workflows.

### Event-Driven Benefits

**Event Sourcing Native**
```typescript
function* processAccountTransaction(event: TransactionEvent) {
  // Store event
  yield* askEventStore('append', 'account-transactions', event);
  
  // Update current state
  const currentBalance = yield* askKeyValueStoreGet('account-balances', event.accountId);
  const newBalance = currentBalance + event.amount;
  yield* askKeyValueStoreUpdate('account-balances', event.accountId, { balance: newBalance });
  
  // Trigger side effects
  if (newBalance < 0) {
    yield* askEventBusSendMessage('overdraft-detected', { accountId: event.accountId });
  }
}
```

**CQRS Implementation**
- Separate read and write models
- Automatic projection updates
- Event replay for rebuilding projections
- Optimized query patterns

**Saga Pattern Support**
```typescript
function* orderSaga(orderId: string) {
  try {
    // Start transaction
    yield* askBeginTransaction();
    
    // Step 1: Reserve inventory
    const reservation = yield* askServiceFunction('inventory', 'reserve', orderId);
    
    // Step 2: Charge payment
    const payment = yield* askServiceFunction('payment', 'charge', orderId);
    
    // Step 3: Create shipment
    const shipment = yield* askServiceFunction('shipping', 'create', orderId);
    
    // Commit transaction
    yield* askCommitTransaction();
    
  } catch (error) {
    // Automatic compensation
    yield* askRollbackTransaction();
    yield* askServiceFunction('inventory', 'cancelReservation', reservation.id);
    yield* askServiceFunction('payment', 'refund', payment.id);
  }
}
```

## Multi-Cloud Deployments

Deploy different parts of your application to different cloud providers based on their strengths.

### Multi-Cloud Benefits

**Best-of-Breed Services**
- Use AWS Lambda for compute
- Google Cloud Vision for AI
- Azure Cosmos DB for global distribution
- Cloudflare Workers for edge computing

**Disaster Recovery**
```typescript
// Deploy the same story to multiple clouds
const config = {
  primary: {
    platform: 'aws',
    region: 'us-east-1'
  },
  failover: {
    platform: 'gcp',
    region: 'us-central1'
  }
};
```

**Cost Arbitrage**
- Run workloads where they're cheapest
- Take advantage of free tiers across providers
- Optimize for reserved instance discounts
- Automatic workload migration based on pricing

## Data Processing Pipelines

Build robust ETL pipelines with built-in error handling and monitoring.

### Pipeline Benefits

```typescript
function* etlPipeline(source: string) {
  // Extract
  const rawData = yield* askFileReadTextContents('raw-data', source);
  const records = yield* askParseCSV(rawData);
  
  // Transform with parallel processing
  const transformed = yield* askMapParallelBatch(records, 
    function* transformRecord(record) {
      const enriched = yield* askServiceFunction('enrichment', 'enrich', record);
      const validated = yield* askValidateRecord(enriched);
      return validated;
    },
    { batchSize: 100 }
  );
  
  // Load
  yield* askKeyValueStoreBatchWrite('processed-data', transformed);
  
  // Notify completion
  yield* askEventBusSendMessage('pipeline-complete', {
    source,
    recordCount: transformed.length,
    timestamp: yield* askDateNow()
  });
}
```

## Real-Time Applications

Build WebSocket-based real-time applications with ease.

### Real-Time Benefits

```typescript
function* handleWebSocketConnection(connectionId: string) {
  // Store connection
  yield* askWebSocketRegister(connectionId);
  
  // Subscribe to events
  yield* askEventBusSubscribe('chat-messages', function* (message) {
    yield* askWebSocketSend(connectionId, message);
  });
  
  // Handle incoming messages
  yield* askWebSocketOnMessage(connectionId, function* (data) {
    // Broadcast to all connections
    const connections = yield* askWebSocketGetConnections();
    yield* askBatch(
      connections.map(conn => 
        askWebSocketSend(conn, data)
      )
    );
  });
}
```

## Testing & Quality Assurance

Quidproquo's architecture makes testing significantly easier.

### Testing Benefits

**Unit Testing Stories**
```typescript
test('order processing', async () => {
  const story = processOrder('order-123');
  
  // Test each yielded action
  const { value: firstAction } = story.next();
  expect(firstAction.type).toBe('KeyValueStore::Get');
  
  // Provide mock response
  const { value: secondAction } = story.next({ id: 'order-123', status: 'pending' });
  expect(secondAction.type).toBe('Queue::SendMessage');
});
```

**Integration Testing with Replay**
```typescript
test('replay production scenario', async () => {
  // Load production logs
  const executionLog = await loadExecutionLog('correlation-id-xyz');
  
  // Replay with modifications
  const result = await qpqExecuteLog(executionLog, story, {
    // Override specific actions for testing
    'File::ReadTextContents': async () => 'test-data'
  });
  
  expect(result).toMatchSnapshot();
});
```

## Migration Scenarios

Quidproquo excels at gradual migration scenarios.

### Migration Benefits

**Monolith to Microservices**
- Extract stories one at a time
- Keep the same business logic
- Change only the deployment target
- Maintain backward compatibility

**On-Premise to Cloud**
- Deploy stories to cloud gradually
- Maintain hybrid architecture during transition
- Roll back instantly if needed
- Zero-downtime migration

**Legacy System Modernization**
- Wrap legacy systems with action processors
- Gradually replace with modern implementations
- Maintain audit trail throughout migration
- Test new implementations against production data

## Compliance & Auditing

Built-in features for regulatory compliance.

### Compliance Benefits

```typescript
function* auditedOperation(userId: string, operation: string) {
  // Automatic audit logging
  yield* askAuditLog({
    userId,
    operation,
    timestamp: yield* askDateNow(),
    ip: yield* askContextRead('ip-address')
  });
  
  // Perform operation
  const result = yield* askSensitiveOperation(operation);
  
  // Log completion
  yield* askAuditLog({
    userId,
    operation,
    result: 'complete',
    timestamp: yield* askDateNow()
  });
  
  return result;
}
```

- Complete audit trails
- Data residency compliance
- GDPR right-to-be-forgotten support
- Encryption at rest and in transit
- Role-based access control

## Choosing Quidproquo

Consider Quidproquo when you need:

✅ **Platform flexibility** - Deploy anywhere without code changes  
✅ **Complete observability** - Know exactly what happened and why  
✅ **Testability** - Easily test complex workflows  
✅ **Maintainability** - Clean separation of business logic  
✅ **Scalability** - From prototype to production  
✅ **Debugging** - Replay production issues locally  
✅ **Compliance** - Built-in audit trails and controls

Quidproquo may not be the best fit if:

❌ You have a simple, static website  
❌ Your team is not comfortable with generator functions  
❌ You need to use a specific framework's ecosystem  
❌ You have extreme low-latency requirements (< 10ms)