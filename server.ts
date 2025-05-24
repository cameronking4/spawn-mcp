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
    
    console.log('Received config:', JSON.stringify(config, null, 2));
    
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

// Update an existing MCP configuration
app.put('/api/configs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, config } = req.body;
    
    console.log('Updating config:', id, 'with data:', JSON.stringify(config, null, 2));
    
    if (!name || !config) {
      return res.status(400).json({ error: 'Name and config are required' });
    }
    
    // Validate that config has mcpServers property
    if (!config.mcpServers) {
      console.error('Invalid config format: missing mcpServers property');
      return res.status(400).json({ error: 'Configuration must have a mcpServers property' });
    }
    
    const result = await db.update(mcpConfigs)
      .set({ name, config })
      .where(eq(mcpConfigs.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Delete a configuration
app.delete('/api/configs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const result = await db.delete(mcpConfigs)
      .where(eq(mcpConfigs.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting config:', error);
    res.status(500).json({ error: 'Failed to delete configuration' });
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
    res.write(`event: connected\ndata: {"id": ${id}, "config": ${JSON.stringify(configResult[0])}}\n\n`);
    
    // Store the connection
    const connectionId = `${id}-${Date.now()}`;
    activeConnections[connectionId] = { res };
    
    // Handle client disconnect
    req.on('close', () => {
      if (activeConnections[connectionId]?.process) {
        console.log(`Killing process for connection: ${connectionId}`);
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
    
    console.log(`Spawning MCP process for connection ${connectionId}: ${serverConfig.command} ${(serverConfig.args || []).join(' ')}`);
    
    // Spawn the MCP server process
    const mcpProcess = spawn(serverConfig.command, serverConfig.args || []);
    activeConnections[connectionId].process = mcpProcess;
    
    // Handle process stdout (model responses)
    mcpProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        console.log(`[${connectionId}] stdout: ${line}`);
        res.write(`event: message\ndata: ${line}\n\n`);
      }
    });
    
    // Handle process stderr (errors and events)
    mcpProcess.stderr.on('data', (data) => {
      console.log(`[${connectionId}] stderr: ${data.toString()}`);
      res.write(`event: error\ndata: ${JSON.stringify({ error: data.toString() })}\n\n`);
    });
    
    // Handle process exit
    mcpProcess.on('close', (code) => {
      console.log(`[${connectionId}] Process exited with code: ${code}`);
      res.write(`event: close\ndata: {"code": ${code}}\n\n`);
      res.end();
      delete activeConnections[connectionId];
    });
    
    // Keep the process alive but don't send an initial prompt
    // The client will send prompts via the /api/prompt/:id endpoint
    
    // Send a heartbeat every 30 seconds to keep the connection alive
    const heartbeatInterval = setInterval(() => {
      if (activeConnections[connectionId]) {
        res.write(`event: heartbeat\ndata: {"timestamp": ${Date.now()}}\n\n`);
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000);
    
  } catch (error) {
    console.error('Error in SSE endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to send prompts to an active SSE connection
app.post('/api/prompt/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Find all active connections for this config ID
    const connectionIds = Object.keys(activeConnections).filter(key => key.startsWith(`${id}-`));
    
    if (connectionIds.length === 0) {
      return res.status(404).json({ error: 'No active connections found for this configuration' });
    }
    
    // Send the prompt to all active connections
    let successCount = 0;
    for (const connectionId of connectionIds) {
      const connection = activeConnections[connectionId];
      if (connection?.process) {
        try {
          console.log(`Sending prompt to connection ${connectionId}:`, JSON.stringify(prompt));
          if (connection.process && connection.process.stdin) {
            connection.process.stdin.write(JSON.stringify(prompt) + '\n');
            successCount++;
          } else {
            console.error(`Process or stdin is null for connection ${connectionId}`);
          }
        } catch (error) {
          console.error(`Error sending prompt to connection ${connectionId}:`, error);
        }
      }
    }
    
    if (successCount === 0) {
      return res.status(500).json({ error: 'Failed to send prompt to any active connections' });
    }
    
    res.json({ 
      success: true, 
      message: `Prompt sent to ${successCount} active connections`,
      connectionCount: connectionIds.length
    });
    
  } catch (error) {
    console.error('Error sending prompt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
