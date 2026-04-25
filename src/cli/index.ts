#!/usr/bin/env node
import { createRequire } from 'node:module';
import { Command } from 'commander';
import open from 'open';
import { createServer } from '../server/index.js';

const require = createRequire(import.meta.url);
const packageJson = require('../../package.json') as {
  name: string;
  description: string;
  version: string;
};

const program = new Command();

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version)
  .option('-p, --port <number>', 'Port to run server on', '3001')
  .option('--no-open', 'Do not open browser automatically')
  .action(async (options: { port: string; open: boolean }) => {
    const port = parseInt(options.port, 10);

    console.log('Starting OpenSpec WebUI...');

    try {
      const server = await createServer({
        port,
      });

      // Open browser
      if (options.open) {
        await open(server.url);
      }

      // Handle shutdown
      const shutdown = async () => {
        console.log('\nShutting down...');
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        await server.close();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      // Enable keyboard shortcuts
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');

        process.stdin.on('data', async (key: string) => {
          // Ctrl+C in raw mode
          if (key === '\u0003') {
            await shutdown();
            return;
          }
          // 'l' or 'L' to open browser
          if (key.toLowerCase() === 'l') {
            await open(server.url);
          }
        });
      }

      console.log(`\nPress 'l' to open browser, Ctrl+C to stop`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('already in use') || (error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
        console.error(`Error: Port ${port} is already in use`);
        console.error('Try using a different port: openspec-webui --port 3003');
        process.exit(1);
      }
      console.error('Failed to start server:', message);
      process.exit(1);
    }
  });

program.parse();
