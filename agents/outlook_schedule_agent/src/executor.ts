import { AgentExecutor, RequestContext, EventBus } from '@a2a-js/sdk';
import { logger } from './utils/logger';
import { OutlookService } from './services/outlook.service';

export class OutlookScheduleExecutor implements AgentExecutor {
  private outlookService: OutlookService;

  constructor() {
    this.outlookService = new OutlookService();
  }

  async execute(requestContext: RequestContext, eventBus: EventBus): Promise<void> {
    try {
      logger.info('Executing Outlook Schedule Agent', {
        traceId: requestContext.traceId,
        messageCount: requestContext.messages.length
      });

      // Extract user message
      const lastMessage = requestContext.messages[requestContext.messages.length - 1];

      if (!lastMessage || lastMessage.role !== 'user') {
        eventBus.publish({
          kind: 'message',
          role: 'agent',
          parts: [
            {
              kind: 'text',
              text: 'エラー: ユーザーメッセージが見つかりません。'
            }
          ]
        });
        eventBus.finished();
        return;
      }

      // Extract text from message parts
      const textParts = lastMessage.parts.filter(part => part.kind === 'text');
      const userQuery = textParts.map(part => part.text).join(' ');

      logger.debug('User query:', { query: userQuery });

      // Extract access token from request context (OBO flow)
      const accessToken = requestContext.metadata?.accessToken as string | undefined;

      if (!accessToken) {
        eventBus.publish({
          kind: 'message',
          role: 'agent',
          parts: [
            {
              kind: 'text',
              text: 'エラー: アクセストークンが提供されていません。認証が必要です。'
            }
          ]
        });
        eventBus.finished();
        return;
      }

      // Process the request based on query intent
      const result = await this.processScheduleRequest(userQuery, accessToken, requestContext.traceId);

      // Send response
      eventBus.publish({
        kind: 'message',
        role: 'agent',
        parts: [
          {
            kind: 'text',
            text: result
          }
        ]
      });

      eventBus.finished();

    } catch (error) {
      logger.error('Error in executor:', error);

      eventBus.publish({
        kind: 'message',
        role: 'agent',
        parts: [
          {
            kind: 'text',
            text: `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
          }
        ]
      });

      eventBus.finished();
    }
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
