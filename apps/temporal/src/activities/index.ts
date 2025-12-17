import 'dotenv/config';
import pino from 'pino';
import { convertPromptToOpenAI } from '@langchain/openai';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import * as hub from 'langchain/hub';

const logger = pino({ name: 'temporal-activities' });

export interface PullPromptInput {
  promptName: string;
  question: string;
}

export interface PullPromptOutput {
  messages: ChatCompletionMessageParam[];
}

export interface OpenAICompletionInput {
  messages: ChatCompletionMessageParam[];
  model: string;
}

export interface OpenAICompletionOutput {
  content: string;
  rawResponse: string;
}

/**
 * Activity: Pull a prompt from LangSmith and format it with the question
 */
export async function pullAndFormatPrompt(
  input: PullPromptInput
): Promise<PullPromptOutput> {
  if (!process.env.LANGSMITH_API_KEY) {
    logger.error({
      msg: 'LANGSMITH_API_KEY is not set; cannot pull prompt',
      promptName: input.promptName,
    });
    throw new Error('LANGSMITH_API_KEY is not configured for activities');
  }

  logger.info({
    msg: 'Pulling LangSmith prompt',
    promptName: input.promptName,
    questionPreview: input.question.slice(0, 200),
  });

  const prompt = await hub.pull(input.promptName, {
    apiKey: process.env.LANGSMITH_API_KEY,
  });

  if (!prompt) {
    throw new Error(`Prompt "${input.promptName}" not found`);
  }

  const formattedPrompt = await prompt.invoke({ question: input.question });

  if (!formattedPrompt) {
    throw new Error('LangSmith prompt did not format input');
  }

  const { messages } = convertPromptToOpenAI(formattedPrompt) as {
    messages: ChatCompletionMessageParam[];
  };

  return { messages };
}

/**
 * Activity: Call OpenAI chat completion API
 */
export async function callOpenAICompletion(
  input: OpenAICompletionInput
): Promise<OpenAICompletionOutput> {
  const openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openAIClient.chat.completions.create({
    model: input.model,
    messages: input.messages,
  });

  const firstChoice = response.choices?.[0];
  const content = extractChoiceContent(firstChoice);

  return {
    content,
    rawResponse: JSON.stringify(response),
  };
}

type ChoiceShape = {
  message?: {
    content?: string | ChatCompletionMessageParam[] | null;
  };
};

type ChunkWithParts = {
  parts?: Array<{ text?: string }>;
};

function extractChoiceContent(choice?: ChoiceShape): string {
  const content = choice?.message?.content;
  if (content == null) {
    return '';
  }

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content) && content.length > 0) {
    return content
      .map((chunk) => {
        if (typeof chunk === 'string') {
          return chunk;
        }

        if (chunk && 'text' in chunk && typeof chunk.text === 'string') {
          return chunk.text;
        }
        if (chunk && 'parts' in chunk) {
          const chunkWithParts = chunk as ChunkWithParts;
          if (Array.isArray(chunkWithParts.parts)) {
            return chunkWithParts.parts
              .map((part) => part?.text ?? '')
              .join('');
          }
        }

        return '';
      })
      .join('')
      .trim();
  }

  return '';
}
