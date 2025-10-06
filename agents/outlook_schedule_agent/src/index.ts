import express from 'express';
import dotenv from 'dotenv';
import type { AgentCard } from '@a2a-js/sdk';
import { DefaultRequestHandler, InMemoryTaskStore } from '@a2a-js/sdk/server';
import { A2AExpressApp } from '@a2a-js/sdk/server/express';
import { OutlookScheduleExecutor } from './executor';
import { logger } from './utils/logger';

dotenv.config();

const PORT = process.env.PORT || 8000;
const AGENT_NAME = process.env.AGENT_NAME || 'Outlook Schedule Agent';
const AGENT_DESCRIPTION = process.env.AGENT_DESCRIPTION || 'An agent that checks Outlook calendar and coordinates availability';
const AGENT_URL = process.env.AGENT_URL || `http://localhost:${PORT}/`;

async function main() {
  try {
    const app = express();

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', agent: AGENT_NAME });
    });

    // Create agent card
    const agentCard: AgentCard = {
      name: AGENT_NAME,
      description: AGENT_DESCRIPTION,
      protocolVersion: '0.3.0',
      version: '1.0.0',
      url: AGENT_URL,
      capabilities: {
        streaming: true
      },
      defaultInputModes: ['text/plain'],
      defaultOutputModes: ['text/plain'],
      skills: [
        {
          id: 'outlook-calendar',
          name: 'Outlook Calendar',
          description: 'Check Outlook calendar and coordinate availability',
          tags: ['outlook', 'calendar', 'schedule']
        }
      ]
    };

    // Create A2A agent executor
    const executor = new OutlookScheduleExecutor();

    // Create request handler
    const taskStore = new InMemoryTaskStore();
    const requestHandler = new DefaultRequestHandler(
      agentCard,
      taskStore,
      executor
    );

    // Create A2A Express app
    const a2aApp = new A2AExpressApp(requestHandler);
    a2aApp.setupRoutes(app);

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
