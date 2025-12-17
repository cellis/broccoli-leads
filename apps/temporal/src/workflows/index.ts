import { log, proxyActivities } from '@temporalio/workflow';
import type {
  LeadProcessingInput,
  LeadProcessingResult,
} from '@broccoli/contracts';
import type * as activities from '../activities';

// Proxy activities - these run in the normal Node.js worker environment
const { pullAndFormatPrompt, callOpenAICompletion } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '60 seconds',
  retry: {
    maximumAttempts: 3,
  },
});

const PROMPT_NAME = 'broccoli-leads';
const MODEL_NAME = 'gpt-4o-mini';
const DEFAULT_LEAD: LeadProcessingResult['lead'] = {
  email: undefined,
  phone: undefined,
  countryCode: undefined,
  address: undefined,
  serviceRequested: undefined,
};

export async function processLeadWorkflow(
  input: LeadProcessingInput
): Promise<LeadProcessingResult> {
  const question =
    input.message.extracted_text ??
    input.message.text ??
    input.message.extracted_html ??
    '';

  log.info('Pulling LangSmith prompt', { prompt: PROMPT_NAME });

  // Call activity to pull and format prompt from LangSmith
  const { messages } = await pullAndFormatPrompt({
    promptName: PROMPT_NAME,
    question,
  });

  // Call activity to get OpenAI completion
  const { content: promptResponse, rawResponse } = await callOpenAICompletion({
    messages,
    model: MODEL_NAME,
  });

  let parsedLead: LeadProcessingResult['lead'] | undefined;
  const responseToUse = promptResponse || rawResponse;

  if (responseToUse) {
    try {
      const parsed = JSON.parse(responseToUse);
      if (typeof parsed === 'object' && parsed !== null) {
        parsedLead = { ...DEFAULT_LEAD, ...parsed };
      } else {
        log.warn('LangSmith prompt response was not an object', {
          promptResponse: responseToUse,
        });
      }
    } catch (error) {
      log.warn('Unable to parse LangSmith JSON output', {
        error,
        promptResponse: responseToUse,
      });
    }
  }

  const details = parsedLead ?? DEFAULT_LEAD;
  log.info(
    `============= PROCESSED LEAD ${JSON.stringify(details)} ==================`
  );

  return {
    question,
    promptResponse: responseToUse,
    messageId: input.message.message_id,
    lead: details,
  };
}
