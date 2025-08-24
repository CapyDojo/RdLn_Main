// Example of using context7 with Upstash Redis
import { Context } from '@upstash/context7';

export async function handleRequest(request: Request, context: Context) {
  // Example usage of context7 features
  const counter = await context.redis.incr("counter");
  
  const response = {
    message: "Hello from context7!",
    counter: counter,
    timestamp: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}