/**
 * Server-Sent Events (SSE) utility functions for real-time updates
 */

// Function to create an EventSource connection for SSE
export const createEventSource = (endpoint: string): EventSource => {
  const eventSource = new EventSource(`/api/${endpoint}`);
  
  // Add error handling
  eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
      eventSource.close();
      createEventSource(endpoint);
    }, 5000);
  };
  
  return eventSource;
};

// Function to subscribe to specific event types
export const subscribeToEvent = (
  eventSource: EventSource,
  eventType: string,
  callback: (data: any) => void
): void => {
  eventSource.addEventListener(eventType, (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      callback(data);
    } catch (error) {
      console.error('Error parsing SSE event data:', error);
    }
  });
};

// Function to close the EventSource connection
export const closeEventSource = (eventSource: EventSource): void => {
  if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
    eventSource.close();
  }
};
