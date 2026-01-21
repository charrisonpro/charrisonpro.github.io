// Configuration for Claude Agents Website

const CONFIG = {
  // Anthropic API settings
  api: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    version: '2023-06-01',
    defaultModel: 'claude-sonnet-4-20250514',
    maxTokens: 2048
  },

  // Storage keys
  storage: {
    apiKey: 'claude_agents_api_key',
    sessions: 'claude_agents_sessions',
    currentSession: 'claude_agents_current_session'
  },

  // Coach types
  coaches: {
    spanish_cr: {
      id: 'spanish_cr',
      name: 'Spanish Coach (Costa Rica)',
      tagline: 'Learn Costa Rican Spanish with warmth and pura vida energy',
      version: 'v1.0',
      model: 'claude-sonnet-4-20250514'
    },
    japanese_kyoto: {
      id: 'japanese_kyoto',
      name: 'Japanese Coach (Kyoto)',
      tagline: 'Explore Kyoto dialect with cultural depth',
      version: 'v1.0',
      model: 'claude-sonnet-4-20250514'
    },
    french_quebec: {
      id: 'french_quebec',
      name: 'French Coach (Quebec)',
      tagline: 'Master Québécois French comprehension',
      version: 'v1.0',
      model: 'claude-sonnet-4-20250514'
    }
  }
};

// Utility functions
const Utils = {
  // Generate unique session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // Format timestamp
  formatTimestamp(date) {
    return new Date(date).toISOString();
  },

  // Simple markdown to HTML
  markdownToHtml(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  },

  // Escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
