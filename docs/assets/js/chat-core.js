// Chat Core - Main chat functionality

class ChatCore {
  constructor(coachConfig, systemPrompt) {
    this.config = coachConfig;
    this.systemPrompt = systemPrompt;
    this.apiKey = null;
    this.sessionId = null;
    this.messages = [];
    this.isLoading = false;
  }

  // Initialize session with API key
  init(apiKey) {
    this.apiKey = apiKey;
    this.sessionId = Utils.generateSessionId();
    this.messages = [];

    // Create session in data collector
    dataCollector.createSession(
      this.sessionId,
      this.config.id,
      this.config.version
    );

    // Store API key in localStorage
    localStorage.setItem(CONFIG.storage.apiKey, apiKey);
    localStorage.setItem(CONFIG.storage.currentSession, this.sessionId);

    return this.sessionId;
  }

  // Load existing API key if available
  loadApiKey() {
    return localStorage.getItem(CONFIG.storage.apiKey);
  }

  // Send message to Anthropic API
  async sendMessage(userInput) {
    if (this.isLoading) {
      throw new Error('Already processing a message');
    }

    if (!this.apiKey) {
      throw new Error('API key not set');
    }

    this.isLoading = true;

    try {
      // Add user message to history
      this.messages.push({
        role: 'user',
        content: userInput
      });

      // Log user message
      dataCollector.logMessage(this.sessionId, 'user', userInput);

      // Call Anthropic API
      const response = await this.callAnthropicAPI();

      // Add assistant message to history
      this.messages.push({
        role: 'assistant',
        content: response
      });

      // Log assistant message
      dataCollector.logMessage(this.sessionId, 'assistant', response);

      return response;
    } finally {
      this.isLoading = false;
    }
  }

  // Make API call to Anthropic
  async callAnthropicAPI() {
    const response = await fetch(CONFIG.api.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': CONFIG.api.version,
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: this.config.model || CONFIG.api.defaultModel,
        max_tokens: CONFIG.api.maxTokens,
        system: this.systemPrompt,
        messages: this.messages
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  // End current session
  endSession() {
    if (this.sessionId) {
      dataCollector.endSession(this.sessionId);
    }
  }

  // Save feedback
  saveFeedback(feedback) {
    if (this.sessionId) {
      dataCollector.saveFeedback(this.sessionId, feedback);
    }
  }

  // Export current session
  exportSession(format = 'markdown') {
    if (this.sessionId) {
      dataCollector.downloadSession(this.sessionId, format);
    }
  }

  // Get message count
  getMessageCount() {
    return this.messages.length;
  }
}

// Chat UI Manager
class ChatUI {
  constructor(chatCore, elements) {
    this.chat = chatCore;
    this.elements = elements;
    this.bindEvents();
  }

  // Bind DOM events
  bindEvents() {
    const { form, input, endSessionBtn, exportBtn, feedbackBtn } = this.elements;

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = input.value.trim();
      if (message) {
        input.value = '';
        await this.handleSendMessage(message);
      }
    });

    // Textarea enter key (without shift)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
      }
    });

    // End session button
    if (endSessionBtn) {
      endSessionBtn.addEventListener('click', () => this.handleEndSession());
    }

    // Export button
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExport());
    }

    // Feedback button
    if (feedbackBtn) {
      feedbackBtn.addEventListener('click', () => this.handleFeedback());
    }
  }

  // Handle sending a message
  async handleSendMessage(message) {
    // Render user message
    this.renderMessage('user', message);

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Send to API
      const response = await this.chat.sendMessage(message);

      // Hide typing indicator
      this.hideTypingIndicator();

      // Render response
      this.renderMessage('assistant', response);

    } catch (error) {
      this.hideTypingIndicator();
      this.showError(error.message);
    }
  }

  // Render a message
  renderMessage(role, content) {
    const { messagesContainer } = this.elements;

    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;

    const roleLabel = role === 'user' ? 'You' : 'Coach';
    const htmlContent = Utils.markdownToHtml(Utils.escapeHtml(content));

    messageEl.innerHTML = `
      <div class="message-role">${roleLabel}</div>
      <div class="message-content">${htmlContent}</div>
    `;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show typing indicator
  showTypingIndicator() {
    const { messagesContainer } = this.elements;

    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.className = 'message assistant';
    indicator.innerHTML = `
      <div class="message-role">Coach</div>
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Hide typing indicator
  hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Show error message
  showError(message) {
    const { messagesContainer } = this.elements;

    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = `Error: ${message}`;

    messagesContainer.appendChild(errorEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Handle end session
  handleEndSession() {
    if (confirm('End this session? You can export the transcript first.')) {
      this.chat.endSession();
      this.showSuccess('Session ended. You can start a new session or export this one.');
    }
  }

  // Handle export
  handleExport() {
    this.chat.exportSession('markdown');
  }

  // Handle feedback
  handleFeedback() {
    const modal = this.elements.feedbackModal;
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  // Show success message
  showSuccess(message) {
    const { messagesContainer } = this.elements;

    const successEl = document.createElement('div');
    successEl.className = 'success-message';
    successEl.textContent = message;

    messagesContainer.appendChild(successEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Clear messages
  clearMessages() {
    const { messagesContainer } = this.elements;
    messagesContainer.innerHTML = '';
  }
}
