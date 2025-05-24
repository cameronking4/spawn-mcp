document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const configForm = document.getElementById('config-form');
  const configNameInput = document.getElementById('config-name');
  const configJsonInput = document.getElementById('config-json');
  const validateBtn = document.getElementById('validate-btn');
  const saveBtn = document.getElementById('save-btn');
  const configsList = document.getElementById('configs-list');
  const sseUrlInput = document.getElementById('sse-url');
  const copyUrlBtn = document.getElementById('copy-url-btn');
  
  // API Base URL
  const API_BASE_URL = window.location.origin;
  
  // Load saved configurations on page load
  loadConfigurations();
  
  // Event Listeners
  validateBtn.addEventListener('click', validateJson);
  configForm.addEventListener('submit', saveConfiguration);
  copyUrlBtn.addEventListener('click', copyUrlToClipboard);
  
  // Functions
  async function loadConfigurations() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/configs`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch configurations');
      }
      
      const configs = await response.json();
      
      if (configs.length === 0) {
        configsList.innerHTML = '<p>No configurations found. Create one above!</p>';
        return;
      }
      
      renderConfigurations(configs);
    } catch (error) {
      console.error('Error loading configurations:', error);
      configsList.innerHTML = `<p class="error">Error loading configurations: ${error.message}</p>`;
    }
  }
  
  function renderConfigurations(configs) {
    configsList.innerHTML = '';
    
    configs.forEach(config => {
      const configCard = document.createElement('div');
      configCard.className = 'config-card';
      
      const sseUrl = `${API_BASE_URL}/sse/${config.id}`;
      
      configCard.innerHTML = `
        <h3>${escapeHtml(config.name)}</h3>
        <pre>${escapeHtml(JSON.stringify(config.config, null, 2))}</pre>
        <div class="sse-url">
          <label>SSE URL:</label>
          <input type="text" value="${sseUrl}" readonly>
          <button class="copy-config-url" data-url="${sseUrl}">Copy</button>
          <button class="test-config" data-id="${config.id}">Test</button>
        </div>
      `;
      
      configsList.appendChild(configCard);
      
      // Add event listeners to the buttons in this card
      const copyBtn = configCard.querySelector('.copy-config-url');
      copyBtn.addEventListener('click', () => {
        const url = copyBtn.getAttribute('data-url');
        navigator.clipboard.writeText(url)
          .then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy URL:', err);
          });
      });
      
      const testBtn = configCard.querySelector('.test-config');
      testBtn.addEventListener('click', () => {
        const id = testBtn.getAttribute('data-id');
        sseUrlInput.value = `${API_BASE_URL}/sse/${id}`;
        document.getElementById('connect-btn').disabled = false;
        
        // Scroll to the test section
        document.querySelector('.test-section').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }
  
  function validateJson() {
    const jsonStr = configJsonInput.value.trim();
    
    if (!jsonStr) {
      showMessage('Please enter JSON configuration', 'error');
      return false;
    }
    
    try {
      const parsed = JSON.parse(jsonStr);
      
      // Check if it has the required structure
      if (!parsed.mcpServers || Object.keys(parsed.mcpServers).length === 0) {
        showMessage('JSON must contain a non-empty "mcpServers" object', 'error');
        return false;
      }
      
      // Check if at least one server has command property
      const hasValidServer = Object.values(parsed.mcpServers).some(
        server => server && typeof server.command === 'string'
      );
      
      if (!hasValidServer) {
        showMessage('At least one server must have a "command" property', 'error');
        return false;
      }
      
      showMessage('JSON is valid!', 'success');
      return true;
    } catch (error) {
      showMessage(`Invalid JSON: ${error.message}`, 'error');
      return false;
    }
  }
  
  async function saveConfiguration(event) {
    event.preventDefault();
    
    if (!validateJson()) {
      return;
    }
    
    const name = configNameInput.value.trim();
    if (!name) {
      showMessage('Please enter a configuration name', 'error');
      return;
    }
    
    try {
      const config = JSON.parse(configJsonInput.value);
      
      const response = await fetch(`${API_BASE_URL}/api/configs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          config
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }
      
      const savedConfig = await response.json();
      
      // Clear form
      configNameInput.value = '';
      configJsonInput.value = '';
      
      showMessage('Configuration saved successfully!', 'success');
      
      // Reload configurations
      loadConfigurations();
      
      // Set the SSE URL for testing
      sseUrlInput.value = `${API_BASE_URL}/sse/${savedConfig.id}`;
      document.getElementById('connect-btn').disabled = false;
    } catch (error) {
      console.error('Error saving configuration:', error);
      showMessage(`Error saving configuration: ${error.message}`, 'error');
    }
  }
  
  function copyUrlToClipboard() {
    const url = sseUrlInput.value.trim();
    
    if (!url) {
      showMessage('No URL to copy', 'error');
      return;
    }
    
    navigator.clipboard.writeText(url)
      .then(() => {
        copyUrlBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyUrlBtn.textContent = 'Copy URL';
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy URL:', err);
        showMessage('Failed to copy URL to clipboard', 'error');
      });
  }
  
  function showMessage(message, type) {
    // Remove any existing message
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // Create new message
    const messageElement = document.createElement('p');
    messageElement.className = `form-message ${type}`;
    messageElement.textContent = message;
    
    // Insert after form actions
    const formActions = document.querySelector('.form-actions');
    formActions.parentNode.insertBefore(messageElement, formActions.nextSibling);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      messageElement.remove();
    }, 5000);
  }
  
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
