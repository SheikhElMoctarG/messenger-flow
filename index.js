// messenger-flow/index.js
// Simple Facebook Messenger API wrapper and conversation manager

const axios = require('axios');
const express = require('express');

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

/**
 * Creates an Express webhook handler for Messenger verification and message receiving.
 * @param {string} verifyToken - The token you set in Facebook App dashboard for webhook verification.
 * @param {function} onMessage - Callback to handle incoming messages/events. Receives (event, req, res).
 * @returns {express.Router} Express router to mount at your webhook endpoint.
 */
function createWebhookHandler(verifyToken, onMessage) {
  const router = express.Router();

  // Verification endpoint (GET)
  router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === verifyToken) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  // Message/event endpoint (POST)
  router.post('/', (req, res) => {
    const body = req.body;
    if (body.object === 'page') {
      body.entry.forEach(entry => {
        if (entry.messaging) {
          entry.messaging.forEach(event => {
            if (onMessage) onMessage(event, req, res);
          });
        }
      });
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  });

  return router;
}

module.exports = { MessengerClient, ConversationManager, createWebhookHandler };
