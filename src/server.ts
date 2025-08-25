// Legacy server.ts - now imports the new Express server
import { startServer } from './app/server.js';

// Re-export for backward compatibility
export { startServer };

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}


