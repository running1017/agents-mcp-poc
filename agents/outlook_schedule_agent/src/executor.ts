import type { AgentExecutor, RequestContext, ExecutionEventBus } from '@a2a-js/sdk/server';
import type { Message } from '@a2a-js/sdk';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './utils/logger';
import { OutlookService } from './services/outlook.service';

export class OutlookScheduleExecutor implements AgentExecutor {
  private outlookService: OutlookService;

  constructor() {
    this.outlookService = new OutlookService();
  }

  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    try {
      const { taskId, contextId, userMessage } = requestContext;

      logger.info('Executing Outlook Schedule Agent', {
        taskId,
        contextId
      });

      if (!userMessage || userMessage.role !== 'user') {
        const errorMessage: Message = {
          kind: 'message',
          messageId: uuidv4(),
          role: 'agent',
          contextId,
          parts: [
            {
              kind: 'text',
              text: 'エラー: ユーザーメッセージが見つかりません。'
            }
          ]
        };
        eventBus.publish(errorMessage);
        eventBus.finished();
        return;
      }

      // Extract text from message parts
      const textParts = userMessage.parts.filter((part: any) => part.kind === 'text');
      const userQuery = textParts.map((part: any) => part.text).join(' ');

      logger.debug('User query:', { query: userQuery });

      // Extract access token from request context (OBO flow)
      // TODO: Implement proper OBO token handling from userMessage metadata
      const accessToken = process.env.OUTLOOK_ACCESS_TOKEN as string | undefined;

      if (!accessToken) {
        const errorMessage: Message = {
          kind: 'message',
          messageId: uuidv4(),
          role: 'agent',
          contextId,
          parts: [
            {
              kind: 'text',
              text: 'エラー: アクセストークンが提供されていません。認証が必要です。'
            }
          ]
        };
        eventBus.publish(errorMessage);
        eventBus.finished();
        return;
      }

      // Process the request based on query intent
      const result = await this.processScheduleRequest(userQuery, accessToken, taskId);

      // Send response
      const responseMessage: Message = {
        kind: 'message',
        messageId: uuidv4(),
        role: 'agent',
        contextId,
        parts: [
          {
            kind: 'text',
            text: result
          }
        ]
      };
      eventBus.publish(responseMessage);
      eventBus.finished();

    } catch (error) {
      logger.error('Error in executor:', error);

      const errorMessage: Message = {
        kind: 'message',
        messageId: uuidv4(),
        role: 'agent',
        contextId: requestContext.contextId,
        parts: [
          {
            kind: 'text',
            text: `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
          }
        ]
      };
      eventBus.publish(errorMessage);
      eventBus.finished();
    }
  }

  async cancelTask(taskId: string, _eventBus: ExecutionEventBus): Promise<void> {
    logger.info('Task cancellation requested', { taskId });
    // Simple implementation - in production, implement proper cancellation logic
  }

  private async processScheduleRequest(
    query: string,
    accessToken: string,
    traceId?: string
  ): Promise<string> {
    // Simple intent detection (in production, use LLM for better intent classification)
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('空き時間') || lowerQuery.includes('予定') || lowerQuery.includes('スケジュール')) {
      // Get calendar events
      const events = await this.outlookService.getCalendarEvents(accessToken, traceId);

      if (events.length === 0) {
        return '今週の予定はありません。';
      }

      let response = '今週の予定:\n\n';
      events.forEach((event, index) => {
        response += `${index + 1}. ${event.subject}\n`;
        response += `   日時: ${new Date(event.start.dateTime).toLocaleString('ja-JP')}\n`;
        response += `   場所: ${event.location?.displayName || '未設定'}\n\n`;
      });

      return response;
    }

    return 'Outlookのスケジュールに関する質問をお聞かせください。例: 「今週の予定を教えて」';
  }
}
