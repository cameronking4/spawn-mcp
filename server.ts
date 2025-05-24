import express from 'express';
import { spawn } from 'child_process';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import * as dotenv from 'dotenv';
import { db } from './drizzle/db';
import { mcpConfigs } from './drizzle/schema';
import { eq } from 'drizzle-orm';

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store active SSE connections and child processes
const activeConnections: Record<string, { res: express.Response, process?: ReturnType<typeof spawn> }> = {};

// API Routes
// Get all MCP configurations
app.get('/api/configs', async (req, res) => {
  try {
    const configs = await db.select().from(mcpConfigs);
    res.json(configs);
  } catch (error) {
    console.error('Error fetching configs:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
});

// Get a specific MCP configuration
app.get('/api/configs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const config = await db.select().from(mcpConfigs).where(eq(mcpConfigs.id, id));
    
    if (config.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    res.json(config[0]);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Create a new MCP configuration
app.post('/api/configs', async (req, res) => {
  try {
    const { name, config } = req.body;
    
    if (!name || !config) {
      return res.status(400).json({ error: 'Name and config are required' });
    }
    
    const result = await db.insert(mcpConfigs).values({
      name,
      config
    }).returning();
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating config:', error);
    res.status(500).json({ error: 'Failed to create configuration' });
  }
});

// SSE endpoint
app.get('/sse/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const configResult = await db.select().from(mcpConfigs).where(eq(mcpConfigs.id, id));
    
    if (configResult.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    const config = configResult[0].config as { mcpServers: Record<string, { command: string, args?: string[] }> };
    
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Send initial connection message
    res.write(`event: connected\ndata: {"id": ${id}}\n\n`);
    
    // Store the connection
    const connectionId = `${id}-${Date.now()}`;
    activeConnections[connectionId] = { res };
    
    // Handle client disconnect
    req.on('close', () => {
      if (activeConnections[connectionId]?.process) {
        activeConnections[connectionId].process?.kill();
      }
      delete activeConnections[connectionId];
      console.log(`Client disconnected: ${connectionId}`);
    });
    
    // Get the server config
    const serverName = Object.keys(config.mcpServers)[0]; // Use the first server for simplicity
    const serverConfig = config.mcpServers[serverName];
    
    if (!serverConfig) {
      res.write(`event: error\ndata: {"error": "No server configuration found"}\n\n`);
      return res.end();
    }
    
    // Spawn the MCP server process
    const mcpProcess = spawn(serverConfig.command, serverConfig.args || []);
    activeConnections[connectionId].process = mcpProcess;
    
    // Handle process stdout (model responses)
    mcpProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        res.write(`event: message\ndata: ${line}\n\n`);
      }
    });
    
    // Handle process stderr (errors and events)
    mcpProcess.stderr.on('data', (data) => {
      res.write(`event: error\ndata: ${JSON.stringify({ error: data.toString() })}\n\n`);
    });
    
    // Handle process exit
    mcpProcess.on('close', (code) => {
      res.write(`event: close\ndata: {"code": ${code}}\n\n`);
      res.end();
      delete activeConnections[connectionId];
    });
    
    // Send a sample prompt to the MCP server
    // This is just a basic example - in a real app, this would come from the client
    const samplePrompt = {
      context: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello, world!" }
      ],
      stream: true
    };
    
    mcpProcess.stdin.write(JSON.stringify(samplePrompt));
    mcpProcess.stdin.end();
    
  } catch (error) {
    console.error('Error in SSE endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
