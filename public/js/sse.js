document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const sseUrlInput = document.getElementById('sse-url');
  const connectBtn = document.getElementById('connect-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const sseOutput = document.getElementById('sse-output');
  
  // SSE Connection
  let eventSource = null;
  
  // Event Listeners
  connectBtn.addEventListener('click', connectToSSE);
  disconnectBtn.addEventListener('click', disconnectFromSSE);
  
  // Functions
  function connectToSSE() {
    const url = sseUrlInput.value.trim();
    
    if (!url) {
      appendToOutput('Error: No SSE URL provided', 'error');
      return;
    }
    
    // Clear previous output
    sseOutput.innerHTML = '';
    
    try {
      // Create new EventSource
      eventSource = new EventSource(url);
      
      // Update button states
      connectBtn.disabled = true;
      disconnectBtn.disabled = false;
      
      appendToOutput(`Connecting to: ${url}`, 'info');
      
      // Set up event listeners
      eventSource.addEventListener('open', () => {
        appendToOutput('Connection established', 'success');
      });
      
      eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        appendToOutput(`Connected to SSE stream for config ID: ${data.id}`, 'info');
      });
      
      eventSource.addEventListener('message', (event) => {
        try {
          // Try to parse as JSON
          const data = JSON.parse(event.data);
          appendToOutput(`Received: ${JSON.stringify(data, null, 2)}`, 'message');
        } catch (e) {
          // If not JSON, display as plain text
          appendToOutput(`Received: ${event.data}`, 'message');
        }
      });
      
      eventSource.addEventListener('error', (event) => {
        let errorMessage = 'SSE Error';
        
        try {
          const data = JSON.parse(event.data);
          errorMessage = data.error || errorMessage;
        } catch (e) {
          // If parsing fails, use the default error message
        }
        
        appendToOutput(`Error: ${errorMessage}`, 'error');
      });
      
      eventSource.addEventListener('close', (event) => {
        let message = 'Connection closed';
        
        try {
          const data = JSON.parse(event.data);
          message = `Connection closed with code: ${data.code}`;
        } catch (e) {
          // If parsing fails, use the default message
        }
        
        appendToOutput(message, 'info');
        disconnectFromSSE();
      });
      
      // Handle general error
      eventSource.onerror = (error) => {
        appendToOutput('Connection error or server closed the connection', 'error');
        disconnectFromSSE();
      };
      
    } catch (error) {
      appendToOutput(`Failed to connect: ${error.message}`, 'error');
      disconnectFromSSE();
    }
  }
  
  function disconnectFromSSE() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
      
      appendToOutput('Disconnected from SSE', 'info');
    }
    
    // Update button states
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
  }
  
  function appendToOutput(message, type) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `sse-entry ${type}`;
    
    entry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
    
    sseOutput.appendChild(entry);
    
    // Auto-scroll to bottom
    sseOutput.scrollTop = sseOutput.scrollHeight;
  }
  
  // Add some CSS for the SSE output entries
  const style = document.createElement('style');
  style.textContent = `
    .sse-entry {
      margin-bottom: 5px;
      padding: 3px 0;
      border-bottom: 1px solid #eee;
    }
    
    .sse-entry .timestamp {
      color: #888;
      font-size: 0.9em;
      margin-right: 5px;
    }
    
    .sse-entry.error {
      color: var(--danger-color);
    }
    
    .sse-entry.success {
      color: var(--success-color);
    }
    
    .sse-entry.info {
      color: var(--primary-color);
    }
    
    .sse-entry.message {
      color: var(--dark-color);
    }
  `;
  
  document.head.appendChild(style);
});
