import Pusher from 'pusher';

/**
 * Initialize Pusher server instance
 * Used for real-time notifications and updates
 */
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true,
});

export default pusherServer; 