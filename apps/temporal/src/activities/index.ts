import 'dotenv/config';
import pino from 'pino';
import { Pool, type PoolConfig } from 'pg';
import { convertPromptToOpenAI } from '@langchain/openai';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import * as hub from 'langchain/hub';

const logger = pino({ name: 'temporal-activities' });

// Database connection pool (lazy initialized)
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const config: PoolConfig = {};
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      // ensure that all of these are truthy:
      config.database = process.env.DB_NAME;
      config.host = process.env.DB_HOST;
      config.port = Number.parseInt(process.env.DB_PORT ?? '5432');
      config.user = process.env.PG_MIGRATION_USER;
      // except password in development
      if (process.env.NODE_ENV !== 'development') {
        config.password = process.env.PG_MIGRATION_PASSWORD;
      }

      if (
        !config.database ||
        !config.host ||
        !config.port ||
        !config.user ||
        (!config.password && process.env.NODE_ENV === 'production')
      ) {
        throw new Error(
          [
            'Either DATABASE_URL or all of the following',
            'environment variables are not configured:',
            'DB_NAME, DB_HOST, DB_PORT',
            'PG_MIGRATION_USER',
            'PG_MIGRATION_PASSWORD (only in production)',
          ].join('\n')
        );
      }

      pool = new Pool(config);
    } else {
      pool = new Pool({ connectionString });
    }
  }
  return pool;
}

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

// ============ LEAD PERSISTENCE ============

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'converted'
  | 'lost'
  | 'archived';

export type ChatChannel =
  | 'sms'
  | 'email'
  | 'whatsapp'
  | 'phone'
  | 'web'
  | 'other';

export interface SaveLeadInput {
  customerName?: string;
  customerNumber?: string;
  customerAddress?: string;
  provider: string;
  providerLeadId?: string;
  orgId: string;
  status?: LeadStatus;
  leadRawData?: Record<string, unknown>;
  chatChannel?: ChatChannel;
  processingError?: string;
}

export interface SaveLeadOutput {
  leadId: string;
  created: boolean;
}

/**
 * Activity: Save a lead to the database
 */
export async function saveLead(input: SaveLeadInput): Promise<SaveLeadOutput> {
  const db = getPool();

  logger.info({
    msg: 'Saving lead to database',
    provider: input.provider,
    providerLeadId: input.providerLeadId,
    orgId: input.orgId,
  });

  const result = await db.query<{ id: string }>(
    `INSERT INTO broccoli.leads (
      customer_name,
      customer_number,
      customer_address,
      provider,
      provider_lead_id,
      org_id,
      status,
      lead_raw_data,
      chat_channel,
      processing_error
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id`,
    [
      input.customerName ?? null,
      input.customerNumber ?? null,
      input.customerAddress ?? null,
      input.provider,
      input.providerLeadId ?? null,
      input.orgId,
      input.status ?? 'new',
      input.leadRawData ? JSON.stringify(input.leadRawData) : null,
      input.chatChannel ?? 'email',
      input.processingError ?? null,
    ]
  );

  const leadId = result.rows[0].id;

  logger.info({
    msg: 'Lead saved successfully',
    leadId,
    provider: input.provider,
  });

  return {
    leadId,
    created: true,
  };
}
