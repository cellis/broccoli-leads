import { Injectable, Logger } from '@nestjs/common';
import { Pool, type PoolConfig } from 'pg';
import type { Lead, LeadStatus, ListLeadsQuery } from '@broccoli/contracts';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);
  private pool: Pool | null = null;

  private getPool(): Pool {
    if (!this.pool) {
      const config: PoolConfig = {};
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        config.database = process.env.DB_NAME;
        config.host = process.env.DB_HOST;
        config.port = Number.parseInt(process.env.DB_PORT ?? '5432');
        config.user = process.env.PG_MIGRATION_USER;
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

        this.pool = new Pool(config);
      } else {
        this.pool = new Pool({ connectionString });
      }
    }
    return this.pool;
  }

  async listLeads(
    query: ListLeadsQuery
  ): Promise<{ leads: Lead[]; total: number }> {
    const db = this.getPool();
    const { status, limit = 50, offset = 0 } = query;

    this.logger.log({ msg: 'Listing leads', status, limit, offset });

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM broccoli.leads ${whereClause}`,
      params
    );
    const total = Number.parseInt(countResult.rows[0].count, 10);

    // Get paginated leads
    const leadsResult = await db.query<Lead>(
      `SELECT 
        id,
        customer_name,
        customer_number,
        customer_address,
        provider,
        provider_lead_id,
        org_id,
        status,
        lead_raw_data,
        chat_channel,
        processing_error,
        created_at,
        updated_at
      FROM broccoli.leads 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      leads: leadsResult.rows,
      total,
    };
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const db = this.getPool();

    const result = await db.query<Lead>(
      `SELECT 
        id,
        customer_name,
        customer_number,
        customer_address,
        provider,
        provider_lead_id,
        org_id,
        status,
        lead_raw_data,
        chat_channel,
        processing_error,
        created_at,
        updated_at
      FROM broccoli.leads 
      WHERE id = $1`,
      [id]
    );

    return result.rows[0] ?? null;
  }

  async updateLeadStatus(id: string, status: LeadStatus): Promise<Lead | null> {
    const db = this.getPool();

    this.logger.log({ msg: 'Updating lead status', id, status });

    const result = await db.query<Lead>(
      `UPDATE broccoli.leads 
       SET status = $2
       WHERE id = $1
       RETURNING 
        id,
        customer_name,
        customer_number,
        customer_address,
        provider,
        provider_lead_id,
        org_id,
        status,
        lead_raw_data,
        chat_channel,
        processing_error,
        created_at,
        updated_at`,
      [id, status]
    );

    return result.rows[0] ?? null;
  }
}
