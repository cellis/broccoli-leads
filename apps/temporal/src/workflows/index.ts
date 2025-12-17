import { log, proxyActivities } from '@temporalio/workflow';
import type {
  LeadProcessingInput,
  LeadProcessingResult,
} from '@broccoli/contracts';
import type * as activities from '../activities';

// Proxy activities - these run in the normal Node.js worker environment
const { pullAndFormatPrompt, callOpenAICompletion, saveLead } = proxyActivities<
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

// Values that indicate a field is missing/not available from AI parsing
const MISSING_VALUE_PATTERNS = [
  'n/a',
  'na',
  'none',
  'null',
  'undefined',
  '-',
  '',
];

/**
 * Check if a parsed value is actually missing (empty, null, or placeholder like "N/A")
 */
function isMissingValue(value: string | undefined | null): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return MISSING_VALUE_PATTERNS.includes(normalized);
}

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
  let messages: Awaited<ReturnType<typeof pullAndFormatPrompt>>['messages'];
  try {
    const result = await pullAndFormatPrompt({
      promptName: PROMPT_NAME,
      question,
    });
    messages = result.messages;
  } catch (error) {
    log.error('Failed to pull/format LangSmith prompt', {
      error: String(error),
      promptName: PROMPT_NAME,
      questionPreview: question.slice(0, 100),
    });
    throw error;
  }

  // Call activity to get OpenAI completion
  let promptResponse: string;
  let rawResponse: string;
  try {
    const result = await callOpenAICompletion({
      messages,
      model: MODEL_NAME,
    });
    promptResponse = result.content;
    rawResponse = result.rawResponse;
  } catch (error) {
    log.error('Failed to call OpenAI completion', {
      error: String(error),
      model: MODEL_NAME,
      messageCount: messages.length,
    });
    throw error;
  }

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

  // Check for missing phone number and set processing error if needed
  let processingError: string | undefined;
  const hasValidPhone = !isMissingValue(details?.phone);
  if (!hasValidPhone) {
    processingError = 'Missing phone number';
    log.warn('Lead is missing phone number', {
      messageId: input.message.message_id,
      from: input.message.from,
      phoneValue: details?.phone,
    });
  }

  // Save lead to database (don't save placeholder values like "N/A")
  const { leadId } = await saveLead({
    customerName: details?.email ? undefined : input.message.from, // Use from if no name extracted
    customerNumber: hasValidPhone ? details?.phone : undefined,
    customerAddress: isMissingValue(details?.address)
      ? undefined
      : details?.address,
    provider: 'agentmail',
    providerLeadId: input.message.message_id,
    orgId: input.message.organization_id,
    status: 'new',
    leadRawData: {
      eventId: input.eventId,
      threadId: input.threadId,
      inboxId: input.inboxId,
      subject: input.message.subject,
      from: input.message.from,
      extractedText: input.message.extracted_text,
      serviceRequested: details?.serviceRequested,
    },
    chatChannel: 'email',
    processingError,
  });

  log.info('Lead saved to database', { leadId });

  return {
    question,
    promptResponse: responseToUse,
    messageId: input.message.message_id,
    lead: details,
  };
}
