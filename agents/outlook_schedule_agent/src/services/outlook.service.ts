import axios from 'axios';
import { logger } from '../utils/logger';

interface CalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  organizer?: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
}

export class OutlookService {
  private readonly outlookMcpUrl: string;

  constructor() {
    this.outlookMcpUrl = process.env.OUTLOOK_MCP_URL || 'http://outlook-mcp:8000';
  }

  async getCalendarEvents(accessToken: string, traceId?: string): Promise<CalendarEvent[]> {
    try {
      logger.info('Fetching calendar events from Outlook MCP', { traceId });

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // Add W3C Trace Context header if traceId is provided
      if (traceId) {
        headers['traceparent'] = `00-${traceId}-${this.generateSpanId()}-01`;
      }

      const response = await axios.get(`${this.outlookMcpUrl}/api/calendar/events`, {
        headers,
        params: {
          // Get events for the next 7 days
          startDateTime: new Date().toISOString(),
          endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      });

      logger.debug('Calendar events retrieved', {
        count: response.data.length,
        traceId
      });

      return response.data;

    } catch (error) {
      logger.error('Failed to fetch calendar events:', error);

      if (axios.isAxiosError(error)) {
        throw new Error(`Outlook MCP error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }

      throw error;
    }
  }

  async searchAvailability(
    userEmail: string,
    startTime: Date,
    endTime: Date,
    accessToken: string,
    traceId?: string
  ): Promise<any> {
    try {
      logger.info('Searching availability', { userEmail, startTime, endTime, traceId });

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      if (traceId) {
        headers['traceparent'] = `00-${traceId}-${this.generateSpanId()}-01`;
      }

      const response = await axios.post(
        `${this.outlookMcpUrl}/api/calendar/availability`,
        {
          userEmail,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        },
        { headers }
      );

      return response.data;

    } catch (error) {
      logger.error('Failed to search availability:', error);

      if (axios.isAxiosError(error)) {
        throw new Error(`Outlook MCP error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }

      throw error;
    }
  }

  private generateSpanId(): string {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}
