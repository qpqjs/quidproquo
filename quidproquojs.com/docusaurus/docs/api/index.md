---
sidebar_position: 1
---

# API Reference

Complete API documentation for the quidproquo framework, split into two sections:

## Config

The `defineXYZ(...)` functions you compose into your service's QPQ config. Each one declares a piece of infrastructure or configuration — storage drives, queues, event buses, routes — that the deploy layer turns into real resources.

## Action Requesters

The `askXYZ(...)` generator functions your stories use to actually do things — read files, send messages, query users. Each page documents the function's parameters, return type, errors, and the config that controls it.

Both sections are organised by package (`@qpqjs/core`, `@qpqjs/webserver`, ...), and within Action Requesters by action domain (File, Queue, EventBus, ...).
