/**
 * Ornave Platform - Main Entry Point
 * Initializes and starts the backend server
 */

import { startServer } from './index';

// Start the server
startServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
