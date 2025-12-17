const env = require('dotenv').config().parsed;

const toExport = {
  database: env.DB_NAME || process.env.DB_NAME,
  host: env.DB_HOST || process.env.DB_HOST,
  port: env.DB_PORT || process.env.DB_PORT,
  user: env.PG_MIGRATION_USER || process.env.PG_MIGRATION_USER,
  password:
    env.PG_MIGRATION_PASSWORD || process.env.PG_MIGRATION_PASSWORD || '',
  migrationsTable: env.MIGRATIONS_TABLE || process.env.MIGRATIONS_TABLE,
  skip: false,
};

if (process.env.NODE_ENV === 'production') {
  toExport.ssl = {
    rejectUnauthorized: true, // Set to true to verify the server's certificate
  };
}

module.exports = toExport;
