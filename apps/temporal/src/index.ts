import 'dotenv/config';
import { NativeConnection, Worker } from '@temporalio/worker';
import { TASK_QUEUE } from './constants';
import * as activities from './activities';

async function run() {
  // Connect to Temporal server
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  // Create worker
  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: TASK_QUEUE,
    workflowsPath: require.resolve('./workflows'),
    activities,
  });

  console.log('🔄 Temporal worker started');
  console.log(`   Task Queue: ${TASK_QUEUE}`);
  console.log(`   Namespace: ${process.env.TEMPORAL_NAMESPACE || 'default'}`);

  // Start worker
  await worker.run();
  await connection.close();
}

run().catch((err) => {
  console.error('❌ Temporal worker failed:', err.message);
  console.error(
    '💡 Make sure Temporal server is running at',
    process.env.TEMPORAL_ADDRESS || 'localhost:7233'
  );
  console.error(
    '   Start Temporal with: docker run -p 7233:7233 temporalio/auto-setup:latest'
  );
  process.exit(1);
});
