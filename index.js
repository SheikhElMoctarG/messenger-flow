// messenger-flow/index.js
// Simple Facebook Messenger API wrapper and conversation manager

const axios = require('axios');

class MessengerClient {
  constructor(pageAccessToken) {
    this.pageAccessToken = pageAccessToken;
  }

  async sendMessage(recipientId, message) {
    const request_body = {
      recipient: { id: recipientId },
      message: typeof message === 'string' ? { text: message } : message,
    };
    try {
      const res = await axios.post(
        `https://graph.facebook.com/v17.0/me/messages?access_token=${this.pageAccessToken}`,
        request_body
      );
      return res.data;
    } catch (err) {
      throw err.response ? err.response.data : err;
    }
  }
}

class ConversationManager {
  constructor() {
    this.state = {};
  }

  getUserState(userId) {
    return this.state[userId] || {};
  }

  setUserState(userId, newState) {
    this.state[userId] = { ...this.getUserState(userId), ...newState };
  }

  resetUserState(userId) {
    delete this.state[userId];
  }
}

module.exports = { MessengerClient, ConversationManager };
