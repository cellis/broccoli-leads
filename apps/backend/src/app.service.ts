import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { simpleParser } from 'mailparser';
import type { AgentMailMessage } from '@broccoli/contracts';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getHello(): string {
    return 'Hello from Broccoli Backend!';
  }

  async parseRawEmail(rawEmail: string): Promise<AgentMailMessage> {
    const parsed = await simpleParser(rawEmail);
    const now = new Date();
    const timestamp = (parsed.date ?? now).toISOString();
    const messageId = parsed.messageId ?? randomUUID();
    const threadId =
      (parsed.headers.get('in-reply-to') as string | undefined) ??
      (parsed.headers.get('thread-index') as string | undefined) ??
      messageId;

    const toAddresses =
      (parsed.to?.value ?? [])
        .map((recipient) => recipient.address ?? recipient.name)
        .filter((value): value is string => Boolean(value)) ?? [];

    const message: AgentMailMessage = {
      created_at: timestamp,
      extracted_html: parsed.html ?? undefined,
      extracted_text: parsed.text ?? undefined,
      from:
        parsed.from?.value?.[0]?.address ??
        parsed.from?.value?.[0]?.name ??
        'unknown@broccoli.com',
      from_: parsed.from?.text ?? undefined,
      html: parsed.html ?? undefined,
      inbox_id: process.env.AGENTMAIL_INBOX_ID ?? 'agentmail-inbox',
      labels: [],
      message_id: messageId,
      organization_id: process.env.ORGANIZATION_ID ?? 'broccoli-org',
      pod_id: process.env.POD_ID ?? 'broccoli-pod',
      preview: (parsed.text ?? parsed.subject ?? '').slice(0, 160),
      size: Buffer.byteLength(rawEmail, 'utf8'),
      smtp_id:
        (parsed.headers.get('x-smtp-id') as string | undefined) ?? undefined,
      subject: parsed.subject ?? undefined,
      text: parsed.text ?? undefined,
      thread_id: threadId,
      timestamp,
      to: toAddresses,
      updated_at: now.toISOString(),
    };

    this.logger.log('Parsed incoming email', { messageId, from: message.from });

    return message;
  }
}
