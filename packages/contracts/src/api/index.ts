import { z } from 'zod';

// Example API request/response schemas
export const CreateClientRequestSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  metadata: z.record(z.unknown()).optional(),
});

export const ClientResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateClientRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const AgentMailMessageSchema = z.object({
  created_at: z.string().datetime(),
  extracted_html: z.string().optional(),
  extracted_text: z.string().optional(),
  from: z.string(),
  from_: z.string().optional(),
  html: z.string().optional(),
  inbox_id: z.string(),
  labels: z.array(z.string()),
  message_id: z.string(),
  organization_id: z.string(),
  pod_id: z.string(),
  preview: z.string().optional(),
  size: z.number().optional(),
  smtp_id: z.string().optional(),
  subject: z.string().optional(),
  text: z.string().optional(),
  thread_id: z.string(),
  timestamp: z.string().datetime(),
  to: z.array(z.string()),
  updated_at: z.string().datetime(),
});

export const AgentMailThreadSchema = z.object({
  created_at: z.string().datetime(),
  inbox_id: z.string(),
  labels: z.array(z.string()),
  last_message_id: z.string(),
  message_count: z.number(),
  organization_id: z.string(),
  pod_id: z.string(),
  preview: z.string().optional(),
  received_timestamp: z.string().datetime(),
  recipients: z.array(z.string()),
  senders: z.array(z.string()),
  size: z.number().optional(),
  subject: z.string().optional(),
  thread_id: z.string(),
  timestamp: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const AgentMailEventSchema = z.object({
  body_included: z.boolean().optional().default(true),
  event_id: z.string(),
  event_type: z.string(),
  message: AgentMailMessageSchema,
  thread: AgentMailThreadSchema,
  type: z.string(),
});

// Accept either raw email payloads or AgentMail webhook events
export const ReceiveEmailRequestSchema = z.union([
  z.object({
    rawEmail: z.string().min(1),
    messageId: z.string().optional(),
    source: z.string().optional(),
  }),
  AgentMailEventSchema,
]);

export const ParsedEmailSchema = z.object({
  subject: z.string().optional(),
  from: z.string().optional(),
  to: z.array(z.string()).optional(),
  date: z.string().datetime().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  messageId: z.string().optional(),
});

export const TestRequestSchema = z.object({
  rawEmail: z.string().min(1),
});
// Type exports
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>;
export type ClientResponse = z.infer<typeof ClientResponseSchema>;
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>;
export type AgentMailMessage = z.infer<typeof AgentMailMessageSchema>;
export type AgentMailThread = z.infer<typeof AgentMailThreadSchema>;
export type AgentMailEvent = z.infer<typeof AgentMailEventSchema>;
export type ReceiveEmailRequest = z.infer<typeof ReceiveEmailRequestSchema>;
export type ParsedEmail = z.infer<typeof ParsedEmailSchema>;
export type TestRequest = z.infer<typeof TestRequestSchema>;

// Lead status enum matching database
export const LeadStatusSchema = z.enum([
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
  'archived',
]);

export const ChatChannelSchema = z.enum([
  'sms',
  'email',
  'whatsapp',
  'phone',
  'web',
  'other',
]);

export const LeadSchema = z.object({
  id: z.string().uuid(),
  customer_name: z.string().nullable(),
  customer_number: z.string().nullable(),
  customer_address: z.string().nullable(),
  provider: z.string(),
  provider_lead_id: z.string().nullable(),
  org_id: z.string().uuid(),
  status: LeadStatusSchema,
  lead_raw_data: z.record(z.unknown()).nullable(),
  chat_channel: ChatChannelSchema.nullable(),
  processing_error: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ListLeadsQuerySchema = z.object({
  status: LeadStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const ListLeadsResponseSchema = z.object({
  leads: z.array(LeadSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export const UpdateLeadStatusRequestSchema = z.object({
  status: LeadStatusSchema,
});

export type LeadStatus = z.infer<typeof LeadStatusSchema>;
export type ChatChannel = z.infer<typeof ChatChannelSchema>;
export type Lead = z.infer<typeof LeadSchema>;
export type ListLeadsQuery = z.infer<typeof ListLeadsQuerySchema>;
export type ListLeadsResponse = z.infer<typeof ListLeadsResponseSchema>;
export type UpdateLeadStatusRequest = z.infer<
  typeof UpdateLeadStatusRequestSchema
>;
