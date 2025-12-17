import { Connection, Client } from '@temporalio/client';
import { TASK_QUEUE } from './constants';
import { exampleWorkflow } from './workflows';

export async function createTemporalClient() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  const client = new Client({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
  });

  return client;
}

export async function startExampleWorkflow(client: Client, name: string) {
  const handle = await client.workflow.start(exampleWorkflow, {
    args: [name],
    taskQueue: TASK_QUEUE,
    workflowId: `example-workflow-${Date.now()}`,
  });

  return handle;
}


