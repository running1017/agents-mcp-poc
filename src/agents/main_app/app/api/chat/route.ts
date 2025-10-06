import { createAzure } from '@ai-sdk/azure';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Azure OpenAI configuration
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Azure OpenAI deployment name from environment variable
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o';

  const result = streamText({
    model: azure(deploymentName),
    messages,
    async onFinish({ text, finishReason, usage }) {
      // ここで将来的にエージェントへのルーティングロジックを追加
      console.log('Finished:', { text, finishReason, usage });
    },
  });

  return result.toTextStreamResponse();
}
