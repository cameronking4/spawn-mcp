CREATE TABLE IF NOT EXISTS "mcp_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
