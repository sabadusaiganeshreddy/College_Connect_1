import { redisSubscriber } from '../cache/redis.js';

export const PLACEMENT_EVENTS_CHANNEL = 'placement-events';

const clients = new Set();

export function addSseClient(response) {
  clients.add(response);
  response.write('event: ready\n');
  response.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`);

  response.on('close', () => {
    clients.delete(response);
  });
}

export function broadcastToLocalClients(event) {
  const payload = JSON.stringify(event);

  for (const client of clients) {
    client.write('event: placement-update\n');
    client.write(`data: ${payload}\n\n`);
  }
}

export async function startRealtimeBridge() {
  redisSubscriber.on('message', (channel, message) => {
    if (channel !== PLACEMENT_EVENTS_CHANNEL) {
      return;
    }

    try {
      broadcastToLocalClients(JSON.parse(message));
    } catch (error) {
      console.error('[api] Failed to parse realtime event', error);
    }
  });

  await redisSubscriber.subscribe(PLACEMENT_EVENTS_CHANNEL);

  console.log('[api] Redis realtime bridge subscribed');
}
