// Data Collector - Session logging for Bayesian evaluation

class DataCollector {
  constructor() {
    this.storageKey = CONFIG.storage.sessions;
  }

  // Get all sessions from localStorage
  getAllSessions() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : {};
  }

  // Save all sessions to localStorage
  saveAllSessions(sessions) {
    localStorage.setItem(this.storageKey, JSON.stringify(sessions));
  }

  // Create a new session
  createSession(sessionId, coachType, coachVersion) {
    const sessions = this.getAllSessions();

    sessions[sessionId] = {
      meta: {
        sessionId: sessionId,
        coachType: coachType,
        coachVersion: coachVersion,
        startTime: Utils.formatTimestamp(new Date()),
        endTime: null,
        duration: null,
        messageCount: 0,
        evaluationStatus: 'pending'
      },
      messages: [],
      feedback: null
    };

    this.saveAllSessions(sessions);
    return sessions[sessionId];
  }

  // Log a message (user or assistant)
  logMessage(sessionId, role, content) {
    const sessions = this.getAllSessions();

    if (!sessions[sessionId]) {
      console.error('Session not found:', sessionId);
      return;
    }

    const message = {
      role: role,
      content: content,
      timestamp: Date.now()
    };

    sessions[sessionId].messages.push(message);
    sessions[sessionId].meta.messageCount = sessions[sessionId].messages.length;

    this.saveAllSessions(sessions);
    return message;
  }

  // End a session
  endSession(sessionId) {
    const sessions = this.getAllSessions();

    if (!sessions[sessionId]) {
      console.error('Session not found:', sessionId);
      return;
    }

    const session = sessions[sessionId];
    const startTime = new Date(session.meta.startTime).getTime();
    const endTime = Date.now();

    session.meta.endTime = Utils.formatTimestamp(new Date(endTime));
    session.meta.duration = endTime - startTime;

    this.saveAllSessions(sessions);
    return session;
  }

  // Save feedback for a session
  saveFeedback(sessionId, feedback) {
    const sessions = this.getAllSessions();

    if (!sessions[sessionId]) {
      console.error('Session not found:', sessionId);
      return;
    }

    sessions[sessionId].feedback = {
      ...feedback,
      timestamp: Date.now()
    };

    this.saveAllSessions(sessions);
    return sessions[sessionId].feedback;
  }

  // Get a specific session
  getSession(sessionId) {
    const sessions = this.getAllSessions();
    return sessions[sessionId] || null;
  }

  // Export session as Markdown (for evaluation)
  exportSessionAsMarkdown(sessionId) {
    const session = this.getSession(sessionId);

    if (!session) {
      return null;
    }

    const { meta, messages, feedback } = session;

    let markdown = `# Interaction ${sessionId}

**Submitted by:** web-interface
**Timestamp:** ${meta.startTime}
**Coach:** ${meta.coachType} (${meta.coachVersion})
**Task Type:** pending
**User Goal:** [To be determined by evaluator]

---

## Transcript

`;

    messages.forEach((msg, index) => {
      const role = msg.role === 'user' ? 'User' : 'Coach';
      const time = new Date(msg.timestamp).toLocaleTimeString();
      markdown += `**${role}** (${time}):\n${msg.content}\n\n`;
    });

    markdown += `---

## Session Metadata

- **Duration:** ${meta.duration ? Math.round(meta.duration / 1000 / 60) + ' minutes' : 'N/A'}
- **Message Count:** ${meta.messageCount}
- **End Time:** ${meta.endTime || 'Session not ended'}

`;

    if (feedback) {
      markdown += `---

## User Feedback

- **Rating:** ${feedback.rating || 'N/A'}
- **Notes:** ${feedback.notes || 'None'}
- **Errors Noted:** ${feedback.errors || 'None'}
- **Vocabulary Learned:** ${feedback.vocabulary || 'None'}

`;
    }

    markdown += `---

## Evaluator Judgment

[pending]
`;

    return markdown;
  }

  // Export session as JSON
  exportSessionAsJson(sessionId) {
    return this.getSession(sessionId);
  }

  // Download session as file
  downloadSession(sessionId, format = 'markdown') {
    const session = this.getSession(sessionId);
    if (!session) {
      alert('Session not found');
      return;
    }

    let content, filename, mimeType;

    if (format === 'markdown') {
      content = this.exportSessionAsMarkdown(sessionId);
      filename = `${sessionId}.md`;
      mimeType = 'text/markdown';
    } else {
      content = JSON.stringify(session, null, 2);
      filename = `${sessionId}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Clear all sessions (use with caution)
  clearAllSessions() {
    localStorage.removeItem(this.storageKey);
  }

  // Get session count
  getSessionCount() {
    return Object.keys(this.getAllSessions()).length;
  }

  // Get sessions for a specific coach
  getSessionsByCoach(coachType) {
    const sessions = this.getAllSessions();
    return Object.values(sessions).filter(s => s.meta.coachType === coachType);
  }
}

// Create global instance
const dataCollector = new DataCollector();
