import Pusher from 'pusher-js';

/**
 * Initialize Pusher client instance
 * Used for subscribing to real-time updates in the browser
 */
const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
});

export default pusherClient; 