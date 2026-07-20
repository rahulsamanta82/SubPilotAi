import { createApp } from './app';
import { connectDatabase } from './config/db';

const PORT = 3000;

async function startServer() {
  try {
    const app = await createApp();

    // Bind to the port first so the dev server is marked as successfully started by the platform
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SubPilot Enterprise] Server running flawlessly on http://0.0.0.0:${PORT}`);
      
      // Attempt to connect in the background to avoid crashing the server on startup
      const startConnectionLoop = async () => {
        let connected = false;
        let attempt = 0;
        while (!connected) {
          try {
            await connectDatabase();
            connected = true;
          } catch (error: any) {
            attempt++;
            if (attempt === 1) {
              console.error('==================================================');
              console.error('[SubPilot Enterprise] DATABASE INITIALIZATION FAILED. WILL RETRY IN BACKGROUND.');
              console.error(error.stack || error);
              console.error('==================================================');
            } else {
              console.log(`[SubPilot Enterprise] Database offline. Retrying connection in background (attempt ${attempt})...`);
            }
            // Wait 30 seconds before retrying to connect to be gentler on CPU and logs
            await new Promise((resolve) => setTimeout(resolve, 30000));
          }
        }
      };
      
      startConnectionLoop();
    });
  } catch (error: any) {
    console.error('==================================================');
    console.error('[SubPilot Enterprise] FAILED TO INITIALIZE APP ON STARTUP.');
    console.error(error.stack || error);
    console.error('==================================================');
    process.exit(1);
  }
}

startServer();
