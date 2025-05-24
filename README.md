# MCP SSE Server

A production-ready server for Model Context Protocol (MCP) with Server-Sent Events (SSE) streaming, deployable on Render with zero infrastructure work. Features a modern Next.js frontend with authentication and a comprehensive dashboard.

![MCP SSE Server](https://img.shields.io/badge/MCP-SSE%20Server-blue)
![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Compatible-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **Zero Infrastructure**: Deploy in seconds with Render's one-click setup
- **Built-in Database**: Provision a PostgreSQL database with minimal configuration
- **Real-time Streaming**: Stream model responses via Server-Sent Events (SSE)
- **Modern UI**: Create and manage MCP server configurations through a Next.js dashboard
- **Authentication**: Secure your dashboard with NextAuth.js (GitHub and Google OAuth)
- **Stable Endpoints**: Generate persistent SSE endpoints for each configuration
- **Modern Stack**: Built with Express, Next.js, TypeScript, Drizzle ORM, and PostgreSQL

## Project Structure

This project consists of two main parts:

1. **Backend**: An Express server that handles MCP server spawning and SSE streaming
2. **Frontend**: A Next.js application with authentication and a dashboard for managing configurations

## Quick Start

### Local Development

#### Prerequisites

- Node.js (v18 or later)
- PostgreSQL database

#### Setup

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
PORT=3000
NODE_ENV=development
```

4. Generate and run migrations:

```bash
npm run generate
npx drizzle-kit push:pg
```

5. Set up both backend and frontend:

```bash
npm run setup
```

6. Start both the backend and frontend development servers concurrently:

```bash
npm run dev:all
```

Alternatively, you can run them separately:

```bash
# Backend only
npm run dev

# Frontend only
npm run dev:frontend
```

7. Open your browser and navigate to:
   - Backend API: `http://localhost:3000`
   - Frontend Dashboard: `http://localhost:3002`

## Deployment on Render

### 1. Push Your Code to GitHub/GitLab

Make sure your repository includes all the files in this project, including both the backend and frontend directories.

### 2. Create Web Services on Render

#### Backend Service

1. Log in to your [Render Dashboard](https://dashboard.render.com/)
2. Click **New → Web Service**
3. Connect your GitHub/GitLab repository
4. Configure the service:
   - **Name**: Choose a name (e.g., `mcp-sse-api`)
   - **Environment**: Node
   - **Build Command**: `npm install` (this will trigger the postinstall script that builds and migrates)
   - **Start Command**: `npm start`
5. Click **Create Web Service**

#### Frontend Service

1. Click **New → Web Service** again
2. Connect the same repository
3. Configure the service:
   - **Name**: Choose a name (e.g., `mcp-sse-dashboard`)
   - **Environment**: Node
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Click **Create Web Service**

### 3. Add a PostgreSQL Database

1. In Render, click **New → PostgreSQL Database**
2. Name it (e.g., `mcp-sse-db`)
3. Select the free plan
4. Click **Create Database**
5. Copy the provided `DATABASE_URL` connection string

### 4. Configure Environment Variables

#### Backend Service

1. Go back to your Backend Web Service
2. Navigate to the **Environment** tab
3. Add the following environment variables:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the connection string you copied
   - **Key**: `NODE_ENV`
   - **Value**: `production`

#### Frontend Service

1. Go to your Frontend Web Service
2. Navigate to the **Environment** tab
3. Add the following environment variables:
   - **Key**: `NEXTAUTH_URL`
   - **Value**: Your frontend service URL (e.g., `https://mcp-sse-dashboard.onrender.com`)
   - **Key**: `NEXTAUTH_SECRET`
   - **Value**: Generate a random string (e.g., using `openssl rand -base64 32`)
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your backend service URL (e.g., `https://mcp-sse-api.onrender.com`)
   - **Key**: `GITHUB_ID`
   - **Value**: Your GitHub OAuth App Client ID
   - **Key**: `GITHUB_SECRET`
   - **Value**: Your GitHub OAuth App Client Secret
   - **Key**: `GOOGLE_CLIENT_ID`
   - **Value**: Your Google OAuth Client ID
   - **Key**: `GOOGLE_CLIENT_SECRET`
   - **Value**: Your Google OAuth Client Secret

### 5. Deploy

Render will automatically deploy both services. Once deployed, you can access:
- Backend API at the URL provided for your backend service
- Frontend Dashboard at the URL provided for your frontend service

## Architecture

### Components

1. **Express Backend**:
   - Handles HTTP requests and SSE connections
   - Manages MCP server processes
   - Provides API endpoints for configuration management
   - Streams model responses in real-time

2. **Next.js Frontend**:
   - Provides a modern, responsive UI
   - Handles user authentication with NextAuth.js
   - Offers a dashboard for managing configurations
   - Includes an SSE tester for real-time testing

3. **Shared Components**:
   - **Drizzle ORM**: Provides type-safe database access
   - **PostgreSQL**: Stores MCP configurations and user data
   - **TypeScript**: Ensures type safety across the application

### Database Schema

The application uses a simple database schema with a single table:

- **mcp_configs**: Stores MCP server configurations
  - `id`: Serial primary key
  - `name`: Configuration name
  - `config`: JSON configuration for MCP servers
  - `created_at`: Timestamp

### API Endpoints

- `GET /api/configs`: List all configurations
- `GET /api/configs/:id`: Get a specific configuration
- `POST /api/configs`: Create a new configuration
- `GET /sse/:id`: SSE endpoint for streaming model responses

## Usage

### Authentication

1. Navigate to your frontend URL (e.g., `https://mcp-sse-dashboard.onrender.com`)
2. Click "Sign In" and choose either GitHub or Google authentication
3. Authorize the application to access your account

### Creating a Configuration

1. After signing in, you'll be redirected to the dashboard
2. Go to the "Configurations" tab
3. Click "Create New"
4. Enter a name for your configuration (e.g., "Playwright MCP")
5. Enter a JSON configuration for your MCP server
6. Click "Save Configuration"

### Example Configurations

#### Playwright MCP

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

#### OpenAI CLI

```json
{
  "mcpServers": {
    "openai": {
      "command": "npx",
      "args": ["openai", "api", "chat", "--model", "gpt-4"]
    }
  }
}
```

### Testing the SSE Endpoint

Once you've created a configuration, you can test it directly from the dashboard:

1. Go to the "SSE Endpoints" tab
2. The SSE tester will be pre-populated with your endpoint URL
3. Click "Connect" to establish an SSE connection
4. Watch the real-time responses in the response stream panel

### Using the SSE Endpoint in Your Application

You can use the SSE URL (e.g., `https://mcp-sse-api.onrender.com/sse/1`) in any SSE-capable client:

#### JavaScript Example

```javascript
const eventSource = new EventSource('https://your-app.onrender.com/sse/1');

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Token:', data.token);
});

eventSource.addEventListener('error', (event) => {
  console.error('Error:', event);
});

eventSource.addEventListener('close', (event) => {
  console.log('Connection closed:', event);
  eventSource.close();
});
```

#### Testing with cURL

```bash
curl -N https://your-app.onrender.com/sse/1
```

## Model Context Protocol (MCP)

The Model Context Protocol is a lightweight, STDIO-based specification for interacting with language models over a standard input/output interface. It allows for real-time streaming of model responses and is designed to be simple and extensible.

### Core Concepts

1. **STDIO Transport**
   - **Input**: JSON blob describing context messages
   - **Output**: Incremental response tokens streamed to stdout
   - **Errors & Events**: Non-blocking notifications on stderr

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

## Exposing Your Local Server

During development, you may want to expose your local server to the internet for testing or sharing. Here are several options for tunneling your localhost:

### Using ngrok

[ngrok](https://ngrok.com/) is a popular service for exposing local servers to the internet.

1. Install ngrok:
   ```bash
   npm install -g ngrok
   # or
   brew install ngrok
   ```

2. Start your local server:
   ```bash
   npx ts-node server.ts
   ```

3. In a separate terminal, create a tunnel to your local server:
   ```bash
   ngrok http 3000
   ```

4. ngrok will provide a public URL (e.g., `https://abc123.ngrok.io`) that you can use to access your local server from anywhere.

### Using Cloudflare Tunnel

[Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/) provides a secure way to connect your local server to Cloudflare's network.

1. Install cloudflared:
   ```bash
   # macOS
   brew install cloudflare/cloudflare/cloudflared
   
   # Windows
   choco install cloudflared
   
   # Linux
   wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   dpkg -i cloudflared-linux-amd64.deb
   ```

2. Authenticate with Cloudflare:
   ```bash
   cloudflared tunnel login
   ```

3. Create a tunnel:
   ```bash
   cloudflared tunnel create mcp-sse-tunnel
   ```

4. Start the tunnel:
   ```bash
   cloudflared tunnel run --url http://localhost:3000 mcp-sse-tunnel
   ```

### Using localtunnel

[localtunnel](https://github.com/localtunnel/localtunnel) is a simple and lightweight option.

1. Install localtunnel:
   ```bash
   npm install -g localtunnel
   ```

2. Start your local server:
   ```bash
   npx ts-node server.ts
   ```

3. Create a tunnel:
   ```bash
   lt --port 3000
   ```

4. localtunnel will provide a public URL that you can use to access your local server.

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify your DATABASE_URL is correctly formatted and doesn't contain quotes
2. Ensure your database user has the necessary permissions
3. Check if SSL is required for your database connection
4. For Neon PostgreSQL, ensure the connection string includes `?sslmode=require`

### MCP Server Errors

If your MCP server isn't responding:

1. Verify the command and arguments in your configuration
2. Check if the MCP server package is installed
3. Look for error messages in the server logs

### SSE Connection Issues

If SSE connections are dropping:

1. Ensure your server has enough memory to handle multiple connections
2. Check for timeouts in your proxy or load balancer
3. Verify that your client is handling reconnections properly

### Tunneling Issues

If you're having trouble with tunneling:

1. Make sure your local server is running before starting the tunnel
2. Check if the port is correctly specified in the tunneling command
3. Some tunneling services may have limitations on connection duration or bandwidth
4. For secure applications, ensure your tunnel supports HTTPS

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
