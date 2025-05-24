# MCP SSE Server POC

A proof-of-concept server for STDIO transport od Model Context Protocol (MCP) into instant Server-Sent Events (SSE) streaming, deployable as a service. Instant remote hosted MCP servers with zero infrastructure work.

## Features

- Create and manage MCP server configurations via a simple UI
- Generate stable SSE endpoints for each configuration
- Stream real-time model responses via SSE
- Built with Express, Drizzle ORM, and PostgreSQL
- One-click deployment on Render

## Local Development

### Prerequisites

- Node.js (v18 or later)
- PostgreSQL database

### Setup

1. Clone this repository:

```bash
git clone https://github.com/yourusername/mcp-sse-poc.git
cd mcp-sse-poc
```

2. Install dependencies:

```bash
npm install
```

3. Set up your local PostgreSQL database and create a `.env` file with your database connection string:

```
DATABASE_URL=postgresql://username:password@localhost:5432/mcp_sse_db
```

4. Generate and run migrations:

```bash
npm run generate
npm run migrate
```

5. Start the development server:

```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:3000`

## Deployment on Render

### 1. Push Your Code to GitHub/GitLab

Make sure your repository includes all the files in this project.

### 2. Create a Web Service on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/)
2. Click **New → Web Service**
3. Connect your GitHub/GitLab repository
4. Configure the service:
   - **Name**: Choose a name (e.g., `mcp-sse-poc`)
   - **Environment**: Node
   - **Build Command**: `npm install` (this will trigger the postinstall script that builds and migrates)
   - **Start Command**: `npm start`
5. Click **Create Web Service**

### 3. Add a PostgreSQL Database

1. In Render, click **New → PostgreSQL Database**
2. Name it (e.g., `mcp-sse-db`)
3. Select the free plan
4. Click **Create Database**
5. Copy the provided `DATABASE_URL` connection string

### 4. Configure Environment Variables

1. Go back to your Web Service
2. Navigate to the **Environment** tab
3. Add the following environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the connection string you copied

### 5. Deploy

Render will automatically deploy your application. Once deployed, you can access it at the URL provided by Render.

## Usage

1. Open your deployed application in a browser
2. Create a new MCP server configuration by entering a name and JSON configuration
3. Save the configuration to generate an SSE URL
4. Use the SSE URL in your client application to stream model responses

### Example Configuration

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

## Model Context Protocol (MCP)

The Model Context Protocol is a lightweight, STDIO-based specification for interacting with language models over a standard input/output interface. It allows for real-time streaming of model responses and is designed to be simple and extensible.

### Core Concepts

1. **STDIO Transport**
   - Input: JSON blob describing context messages
   - Output: Incremental response tokens streamed to stdout
   - Errors & Events: Non-blocking notifications on stderr

2. **JSON Message Format**
   ```json
   {
     "context": [
       { "role": "system", "content": "You are a helpful assistant." },
       { "role": "user", "content": "Translate to French: Hello, world!" }
     ],
     "stream": true
   }
   ```

3. **Server-Sent Events (SSE)**
   - Each JSON chunk becomes an SSE event
   - Perfect mapping to MCP's unidirectional streaming model

## License

MIT
