#!/usr/bin/env node
import { Command } from 'commander';
import open from 'open';
import { createServer } from '../server/index.js';

const program = new Command();

program
  .name('openspec-webui')
  .description('Interactive browser UI for OpenSpec projects with server-side project selection')
  .version('0.2.0')
  .option('-p, --port <number>', 'Port to run server on', '3001')
  .option('--no-open', 'Do not open browser automatically')
  .addHelpText(
    'after',
    '\nBootstrap an initial project with OPENSPEC_INITIAL_PROJECT=/path/to/repo openspec-webui\nProject selection is otherwise managed from the running UI.\n'
  )
  .action(async (options: { port: string; open: boolean }) => {
    const port = parseInt(options.port, 10);
    const initialProjectPath = process.env.OPENSPEC_INITIAL_PROJECT?.trim();

    console.log('Starting OpenSpec WebUI...');
    console.log(
      initialProjectPath
        ? `Initial project bootstrap: ${initialProjectPath}`
        : 'Initial project bootstrap: none'
    );

    try {
      const server = await createServer({
        initialProjectPath,
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
