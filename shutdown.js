/**
 * Graceful Shutdown Handler for IdeaVault API
 * Ensures MongoDB connections are properly closed when the server process terminates
 * Prevents connection leaks during deployments, restarts, or unexpected crashes
 */

/**
 * Registers process event listeners for clean shutdown
 * @param {Object} client - MongoDB client instance to close on shutdown
 * @param {Object} server - HTTP server instance to stop accepting connections
 */
function registerShutdownHandlers(client, server) {
  const shutdown = async (signal) => {
    console.log(`\n[SHUTDOWN] Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    if (server) {
      server.close(() => {
        console.log('[SHUTDOWN] HTTP server closed - no longer accepting connections.');
      });
    }

    // Close MongoDB connection
    try {
      if (client) {
        await client.close();
        console.log('[SHUTDOWN] MongoDB connection closed successfully.');
      }
    } catch (error) {
      console.error('[SHUTDOWN] Error closing MongoDB connection:', error.message);
    }

    console.log('[SHUTDOWN] Graceful shutdown complete. Exiting process.');
    process.exit(0);
  };

  // Handle common termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions to prevent silent crashes
  process.on('uncaughtException', (error) => {
    console.error('[FATAL] Uncaught Exception:', error.message);
    console.error(error.stack);
    shutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Promise Rejection:', reason);
    shutdown('unhandledRejection');
  });

  console.log('[INIT] Graceful shutdown handlers registered.');
}

module.exports = { registerShutdownHandlers };
