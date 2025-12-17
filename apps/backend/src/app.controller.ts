import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { TemporalService } from './temporal.service';
import { LeadsService } from './leads.service';
import { UseZodValidation } from './common/decorators/zod-validation.decorator';
import {
  CreateClientRequestSchema,
  type CreateClientRequest,
  ReceiveEmailRequestSchema,
  type ReceiveEmailRequest,
  TestRequestSchema,
  type TestRequest,
  type LeadProcessingInput,
  type AgentMailEvent,
  ListLeadsQuerySchema,
  type ListLeadsQuery,
  type ListLeadsResponse,
  UpdateLeadStatusRequestSchema,
  type UpdateLeadStatusRequest,
  type Lead,
} from '@broccoli/contracts';

// leave this here to help the IDE understand the type of AppService
// nestjs reflection will not work without this
AppService;
TemporalService;
LeadsService;

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly temporalService: TemporalService,
    private readonly leadsService: LeadsService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'backend',
    };
  }

  @Post('clients')
  @UseZodValidation(CreateClientRequestSchema)
  createClient(@Body() data: CreateClientRequest) {
    // Example endpoint using zod validation
    return {
      message: 'Client created',
      data,
    };
  }

  @Get('emails/agentmail')
  @UseZodValidation(TestRequestSchema)
  async getAgentMail(@Query() data: TestRequest) {
    this.logger.log({ message: 'Received AgentMail payload', data });
    return {
      message: `AgentMail payload received ${data.rawEmail}`,
    };
  }

  @Post('emails/agentmail')
  @UseZodValidation(ReceiveEmailRequestSchema)
  async receiveAgentMail(@Body() payload: ReceiveEmailRequest) {
    this.logger.log({ message: 'Received AgentMail payload', payload });

    const isRawEmailPayload = (
      input: ReceiveEmailRequest
    ): input is { rawEmail: string; messageId?: string; source?: string } =>
      'rawEmail' in input &&
      typeof (input as { rawEmail?: unknown }).rawEmail === 'string' &&
      (input as { rawEmail: string }).rawEmail.length > 0;

    let leadInput: LeadProcessingInput;

    if (isRawEmailPayload(payload)) {
      // Raw email path: parse before sending to workflow
      const rawEmailPayload = payload as {
        rawEmail: string;
        messageId?: string;
        source?: string;
      };
      let parsedMessage: Awaited<
        ReturnType<typeof this.appService.parseRawEmail>
      >;
      const rawEmail = rawEmailPayload.rawEmail;

      try {
        parsedMessage = await this.appService.parseRawEmail(rawEmail);
      } catch (error) {
        this.logger.error('Failed to parse raw email', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          rawEmailPreview: rawEmail?.slice(0, 200),
        });
        throw error;
      }

      leadInput = {
        eventId: rawEmailPayload.messageId ?? parsedMessage.message_id,
        message: parsedMessage,
        threadId: parsedMessage.thread_id,
        inboxId: parsedMessage.inbox_id,
      };
    } else {
      // AgentMail webhook path: message already parsed
      const eventPayload = payload as AgentMailEvent;
      const { message } = eventPayload;

      leadInput = {
        eventId: eventPayload.event_id ?? message.message_id,
        message,
        threadId: message.thread_id,
        inboxId: message.inbox_id,
      };
    }

    let workflowHandle: Awaited<
      ReturnType<typeof this.temporalService.startLeadProcessing>
    >;
    try {
      workflowHandle =
        await this.temporalService.startLeadProcessing(leadInput);
    } catch (error) {
      this.logger.error('Failed to start lead processing workflow', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        leadInput,
      });
      throw error;
    }

    this.logger.log({
      message: 'Lead workflow started',
      workflowId: workflowHandle.workflowId,
      eventId: leadInput.eventId,
    });

    return {
      message: 'AgentMail payload received',
      workflowId: workflowHandle.workflowId,
    };
  }

  // ============ LEADS API ============

  @Get('leads')
  @UseZodValidation(ListLeadsQuerySchema)
  async listLeads(@Query() query: ListLeadsQuery): Promise<ListLeadsResponse> {
    this.logger.log({ message: 'Listing leads', query });

    const { leads, total } = await this.leadsService.listLeads(query);

    return {
      leads,
      total,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    };
  }

  @Get('leads/:id')
  async getLeadById(@Param('id') id: string): Promise<Lead> {
    this.logger.log({ message: 'Getting lead by ID', id });

    const lead = await this.leadsService.getLeadById(id);

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return lead;
  }

  @Patch('leads/:id/status')
  @UseZodValidation(UpdateLeadStatusRequestSchema)
  async updateLeadStatus(
    @Param('id') id: string,
    @Body() body: UpdateLeadStatusRequest
  ): Promise<Lead> {
    this.logger.log({
      message: 'Updating lead status',
      id,
      status: body.status,
    });

    const lead = await this.leadsService.updateLeadStatus(id, body.status);

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return lead;
  }
}
