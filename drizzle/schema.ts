import { pgTable, serial, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const mcpConfigs = pgTable('mcp_configs', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  config: jsonb('config').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});
