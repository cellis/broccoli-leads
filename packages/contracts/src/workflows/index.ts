import { z } from 'zod';
import { AgentMailMessageSchema } from '../api/index';

// Example workflow input/output schemas
export const ExampleWorkflowInputSchema = z.object({
  name: z.string().min(1),
  options: z
    .object({
      retryCount: z.number().int().min(0).max(10).optional(),
      timeout: z.number().int().positive().optional(),
    })
    .optional(),
});

export const ExampleWorkflowOutputSchema = z.object({
  result: z.string(),
  executedAt: z.string().datetime(),
});

// Type exports
export type ExampleWorkflowInput = z.infer<typeof ExampleWorkflowInputSchema>;
export type ExampleWorkflowOutput = z.infer<typeof ExampleWorkflowOutputSchema>;

export const LeadProcessingInputSchema = z.object({
  eventId: z.string(),
  message: AgentMailMessageSchema,
  threadId: z.string().optional(),
  inboxId: z.string().optional(),
});

export const ProcessedLeadSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  countryCode: z.string().optional(),
  address: z.string().optional(),
  serviceRequested: z.string().optional(),
});

export const LeadProcessingResultSchema = z.object({
  question: z.string(),
  promptResponse: z.string(),
  messageId: z.string().optional(),
  lead: ProcessedLeadSchema.optional(),
});

export type LeadProcessingInput = z.infer<typeof LeadProcessingInputSchema>;
export type LeadProcessingResult = z.infer<typeof LeadProcessingResultSchema>;


