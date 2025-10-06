import express from 'express';
import dotenv from 'dotenv';
import { A2AExpressApp } from '@a2a-js/sdk';
import { OutlookScheduleExecutor } from './executor';
import { logger } from './utils/logger';

dotenv.config();

const PORT = process.env.PORT || 8000;
const AGENT_NAME = process.env.AGENT_NAME || 'Outlook Schedule Agent';
const AGENT_DESCRIPTION = process.env.AGENT_DESCRIPTION || 'An agent that checks Outlook calendar and coordinates availability';

async function main() {
  try {
    const app = express();

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', agent: AGENT_NAME });
    });

    // Create A2A agent executor
    const executor = new OutlookScheduleExecutor();

    // Create A2A Express app
    const a2aApp = new A2AExpressApp({
      executor,
      agentCard: {
        name: AGENT_NAME,
        description: AGENT_DESCRIPTION,
        version: '1.0.0',
        capabilities: {
          streaming: true,
          tasks: true
        },
        contact: {
          email: process.env.AGENT_CONTACT_EMAIL || 'admin@example.com'
        }
      },
      logger: {
        debug: (msg: string) => logger.debug(msg),
        info: (msg: string) => logger.info(msg),
        warn: (msg: string) => logger.warn(msg),
        error: (msg: string) => logger.error(msg)
      }
    });

    // Mount A2A routes
    app.use(a2aApp.getRouter());

    app.listen(PORT, () => {
      logger.info(`${AGENT_NAME} is running on port ${PORT}`);
      logger.info(`Agent card available at: http://localhost:${PORT}/.well-known/agent-card.json`);
    });
  } catch (error) {
    logger.error('Failed to start agent:', error);
    process.exit(1);
  }
}

main();
