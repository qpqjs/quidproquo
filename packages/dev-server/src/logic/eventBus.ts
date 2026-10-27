// EventBus.ts
import { generateUuid } from 'quidproquo-core';

import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public async publishAndWaitForResponse(eventType: string, payload: any): Promise<any> {
    return new Promise((resolve) => {
      const responseCorrelation = generateUuid();

      // Listen for the response once
      this.once(responseCorrelation, (response) => {
        resolve(response);
      });

      // Emit the event along with the response event name
      this.emit(eventType, payload, responseCorrelation);
    });
  }

  public async publish(eventType: string, payload: any): Promise<void> {
    // console.log('------------------------------------------------------------');
    // console.log('\n\nEventBus - publish: [', eventType, ']', '[', payload?.type, ']');
    // console.log('------------------------------------------------------------');

    this.emit(eventType, payload);
  }
}

// Exporting a singleton instance of EventBus
export const eventBus = EventBus.getInstance();
