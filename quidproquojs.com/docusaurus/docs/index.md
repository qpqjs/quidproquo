---
sidebar_position: 0
slug: /
title: Quidproquo - Platform-Agnostic Web Framework
---

# Quidproquo

A functional, action-based web framework built on generators and pure functions. Business logic never touches a cloud SDK, so the same code runs on Lambda, on Node, or in a browser. Every execution is logged, and you can replay it later.

## What is Quidproquo?

Quidproquo (QPQ) separates business logic from platform implementation using an action/processor pattern. You write pure generator functions, called stories, that yield actions. Platform-specific processors decide how each action actually runs.

### Core Philosophy

At its heart, Quidproquo embraces three fundamental principles:

1. **Pure Functional Composition**: All business logic is expressed as pure generator functions that yield actions and receive results, ensuring deterministic execution and testability.

2. **Platform Abstraction**: Write your application once and deploy it anywhere - AWS Lambda, Node.js servers, browser environments, or any other runtime - without changing your business logic.

3. **Complete Observability**: Every action, decision, and state change is logged, enabling unprecedented debugging capabilities including time-travel debugging and event replay.

### The Problem It Solves

Traditional web frameworks tightly couple your business logic with infrastructure code. When you write an AWS Lambda function, your code is littered with AWS SDK calls. When you need to migrate to Azure or run locally for testing, you face a massive rewrite.

Quidproquo solves this by introducing a layer of abstraction through "actions" - simple, serializable objects that describe what you want to do, not how to do it. The framework handles the "how" through platform-specific action processors.

```typescript
// Instead of this (platform-specific):
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
const s3 = new S3Client();
const result = await s3.send(new GetObjectCommand({
  Bucket: 'my-bucket',
  Key: 'file.txt'
}));

// You write this (platform-agnostic):
function* readFile() {
  const content = yield* askFileReadTextContents('my-drive', 'file.txt');
  return content;
}
```

### Target Audience

Quidproquo is ideal for:

- **Teams building microservices** that need consistent patterns across services
- **Developers working with serverless** who want better local development and testing
- **Organizations requiring multi-cloud deployments** without vendor lock-in
- **Projects needing comprehensive audit logs** and debugging capabilities
- **Applications requiring event sourcing** or replay functionality

## Why Quidproquo?

### Write Once, Deploy Anywhere

Your business logic remains unchanged whether you deploy to:
- AWS Lambda functions
- Google Cloud Functions
- Azure Functions
- Traditional Node.js servers
- Edge computing environments
- Browser/client-side applications

The same story (generator function) works everywhere - only the action processors change.

### Platform Abstraction Benefits

1. **No Vendor Lock-in**: Switch cloud providers or deployment targets without rewriting your application
2. **Simplified Testing**: Test your business logic without mocking complex SDK calls
3. **Local Development**: Run your entire application locally with the dev server, including queues, storage, and databases
4. **Gradual Migration**: Move services between platforms incrementally
5. **Cost Optimization**: Deploy different parts of your application to the most cost-effective platforms

### Comparison with Traditional Frameworks

| Traditional Frameworks | Quidproquo |
|------------------------|------------|
| Business logic mixed with infrastructure code | Clean separation of concerns |
| Platform-specific implementations | Platform-agnostic stories |
| Complex mocking for tests | Pure functions are easily testable |
| Limited debugging for production issues | Complete execution history and replay |
| Difficult to migrate between platforms | Same code runs everywhere |
| Logs show what happened | Logs show what, why, and enable replay |

## Key Features & Benefits

### Complete Execution Logging

Every action your application takes is logged with full context:
- Input parameters
- Return values  
- Execution time
- Error details
- Correlation IDs for tracing

This isn't just logging - it's a complete record of your application's execution that can be replayed.

### Event Replay Capability

Reproduce any execution exactly as it happened:
```typescript
// Replay a previous execution from logs
const result = await qpqExecuteLog(
  executionLog,
  story,
  customActionOverrides
);
```

This enables:
- Debugging production issues locally
- Understanding complex user scenarios
- Regression testing with real data
- Audit compliance

### Time-Travel Debugging

Step through any execution action by action:
- See the exact state at each point
- Understand decision branches taken
- Identify where errors occurred
- Replay with modifications to test fixes

### Deterministic Execution

Generator functions ensure predictable execution:
- Same inputs always produce same outputs
- No hidden side effects
- Easily testable
- Reproducible across environments

### Platform-Agnostic Architecture

Your application consists of three layers:

1. **Stories** (your business logic) - Platform independent
2. **Actions** (what to do) - Standardized interfaces
3. **Processors** (how to do it) - Platform specific

This separation means your business logic never changes, only the processors.

### Generator-Based Composition

Compose complex workflows from simple building blocks:
```typescript
function* processOrder(orderId: string) {
  // Compose multiple actions
  const order = yield* askKeyValueStoreGet('orders', orderId);
  const inventory = yield* askCheckInventory(order.items);
  
  if (inventory.available) {
    yield* askQueueSendMessage('fulfillment', order);
    yield* askEventBusSendMessage('order-confirmed', { orderId });
  }
  
  return { success: inventory.available };
}
```

### Pure Functional Approach

- No side effects in business logic
- Composable and reusable stories
- Easy to reason about
- Simple to test

## Use Cases

Quidproquo excels in numerous scenarios, from microservices to serverless applications. [Explore comprehensive use cases →](./use-cases.md)

## Architecture

Dive deep into the architecture that powers Quidproquo's platform independence and observability. [Explore the architecture →](./architecture-overview.md)

## Next Steps

Ready to get started with Quidproquo? One command scaffolds a complete,
running app:

```bash
npx create-qpq-app myapp
```

<div className="row">
  <div className="col col--6">
    <div className="card">
      <div className="card__header">
        <h3>🚀 Quick Start</h3>
      </div>
      <div className="card__body">
        <p>Scaffold a five-service app that runs locally and deploys as a single docker image.</p>
      </div>
      <div className="card__footer">
        <a href="/getting-started" className="button button--primary button--block">Get Started</a>
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card">
      <div className="card__header">
        <h3>📚 Core Concepts</h3>
      </div>
      <div className="card__body">
        <p>Understand the architecture and patterns that power Quidproquo.</p>
      </div>
      <div className="card__footer">
        <a href="/core-concepts" className="button button--secondary button--block">Learn More</a>
      </div>
    </div>
  </div>
</div>