import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import {
  Connection,
  Client,
  type WorkflowHandleWithFirstExecutionRunId,
} from '@temporalio/client';
import type { LeadProcessingInput } from '@broccoli/contracts';

@Injectable()
export class TemporalService implements OnModuleDestroy {
  private readonly logger = new Logger(TemporalService.name);
  private connection?: Connection;
  private client?: Client;

  private async getClient(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    const address = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';
    this.logger.log('Connecting to Temporal server', { address });

    this.connection = await Connection.connect({ address });
    this.client = new Client({
      connection: this.connection,
      namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
    });

    return this.client;
  }

  async startLeadProcessing(
    input: LeadProcessingInput
  ): Promise<WorkflowHandleWithFirstExecutionRunId> {
    const client = await this.getClient();
    const workflowId = `lead-processing-${input.eventId}-${Date.now()}`;

    this.logger.log('Starting lead processing workflow', {
      workflowId,
      eventId: input.eventId,
    });

    const handle = await client.workflow.start('processLeadWorkflow', {
      args: [input],
      taskQueue: 'broccoli-task-queue',
      workflowId,
    });

    return handle;
  }

  async onModuleDestroy() {
    this.logger.log('Closing Temporal connection');
    await this.connection?.close();
  }
}
