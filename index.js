/**
 * @fileoverview
 * Simple Facebook Messenger API wrapper and conversation manager.
 * Provides an easy way to handle Messenger webhooks, send messages, manage conversations, and respond to events.
 * 
 * @author Sheikh El-Moctar
 * @date 1 jun 2025
 */
const axios = require('axios');
const express = require('express');

class MessengerFlow {
  constructor({ accessToken, verifyToken, appSecret, webhook = '/webhook' }) {
    this.accessToken = accessToken;
    this.verifyToken = verifyToken;
    this.appSecret = appSecret;
    this.webhook = webhook;
    this._events = {};
    this._hear = [];
    this._conversations = {};
    this._app = express();
    this._app.use(express.json());
    this._setupWebhook();
  }

  _setupWebhook() {
    this._app.get(this.webhook, (req, res) => {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      if (mode === 'subscribe' && token === this.verifyToken) {
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    });

    this._app.post(this.webhook, async (req, res) => {
      const body = req.body;
      if (body.object === 'page') {
        for (const entry of body.entry) {
          for (const event of entry.messaging) {
            await this._handleEvent(event);
          }
        }
        res.status(200).send('EVENT_RECEIVED');
      } else {
        res.sendStatus(404);
      }
    });
  }

  _getChat(event) {
    const userId = event.sender.id;
    return {
      say: (msg, opts) => this.say(userId, msg, opts),
      getUserProfile: () => this.getUserProfile(userId),
      conversation: (factory) => this.conversation(userId, factory),
    };
  }

  async _handleEvent(event) {
    const userId = event.sender.id;
    // If in conversation, route to it
    if (this._conversations[userId]) {
      await this._conversations[userId]._handle(event);
      return;
    }
    // .hear (keywords or regex)
    let heard = false;
    if (event.message && event.message.text) {
      const text = event.message.text;
      for (const { keywords, callback } of this._hear) {
        let matched = false;
        if (Array.isArray(keywords)) {
          matched = keywords.some(k =>
            (typeof k === 'string' && text.trim().toLowerCase() === k.toLowerCase()) ||
            (k instanceof RegExp && k.test(text))
          );
        } else if (typeof keywords === 'string') {
          matched = text.trim().toLowerCase() === keywords.toLowerCase();
        } else if (keywords instanceof RegExp) {
          matched = keywords.test(text);
        }
        if (matched) {
          await callback(event, this._getChat(event), { captured: true });
          heard = true;
          break; // Only fire the first matching hear
        }
      }
    }
    // .on (event type)
    for (const type in this._events) {
      if (type === 'message' && event.message && !heard) {
        await this._events[type](event, this._getChat(event), { captured: false });
      }
      if (type === 'postback' && event.postback) {
        await this._events[type](event, this._getChat(event), {});
      }
      // Add more event types as needed
    }
  }

  on(event, callback) {
    this._events[event] = callback;
  }

  hear(keywords, callback) {
    this._hear.push({ keywords, callback });
  }

  async say(userId, message, opts) {
    let msgObj = typeof message === 'string' ? { text: message } : message;
    if (opts && opts.quickReplies) {
      msgObj.quick_replies = opts.quickReplies;
    }
    const request_body = {
      recipient: { id: userId },
      message: msgObj,
    };
    try {
      await axios.post(
        `https://graph.facebook.com/v17.0/me/messages?access_token=${this.accessToken}`,
        request_body
      );
    } catch (err) {
      // console.error('MessengerFlow.send error:', err.response ? err.response.data : err.message);
      // Do not throw, just log so server doesn't crash
    }
  }

  async getUserProfile(userId) {
    const res = await axios.get(
      `https://graph.facebook.com/${userId}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${this.accessToken}`
    );
    return res.data;
  }

  conversation(userId, factory) {
    // Only start a new conversation if one is not already active for this user
    if (this._conversations[userId] && this._conversations[userId]._active) {
      // Optionally, you could end the previous conversation here
      return this._conversations[userId];
    }
    const convo = new Conversation(this, userId);
    this._conversations[userId] = convo;
    // Call factory after the Conversation is constructed, but before the first question is asked
    // So we delay the first _next() until after factory is called
    convo._pauseNext = true;
    factory(convo);
    convo._pauseNext = false;
    convo._next();
    return convo;
  }

  start(port = 3000) {
    this._app.listen(port, () => {
      console.log(`MessengerFlow running on port ${port}`);
      console.log(`Facebook Webhook running on localhost:${port}${this.webhook}`);
    });
  }
}

class Conversation {
  constructor(bot, userId) {
    this.bot = bot;
    this.userId = userId;
    this.context = {};
    this._queue = [];
    this._active = true;
    this._pauseNext = false; // Used to delay first _next() until after factory
    // Do not call _next() here; let MessengerFlow.conversation control when to start
  }

  ask(question, answer) {
    this._queue.push({ question, answer });
    // Only call _next if not paused (pause is used during initial factory setup)
    if (this._queue.length === 1 && !this._pauseNext) this._next();
  }

  async _next() {
    if (!this._active) return;
    if (this._queue.length === 0) {
      this.end();
      return;
    }
    const { question, answer } = this._queue[0];
    await this.bot.say(this.userId, typeof question === 'function' ? question(this) : question);
    this._answer = answer;
  }

  async _handle(event) {
    if (!this._active) return;
    if (event.message && event.message.text) {
      if (this._answer) {
        await this._answer(event, this, {});
        this._queue.shift();
        this._next();
      }
    }
  }

  say(msg) {
    return this.bot.say(this.userId, msg);
  }

  set(key, value) {
    this.context[key] = value;
  }

  get(key) {
    return this.context[key];
  }

  end() {
    this._active = false;
    delete this.bot._conversations[this.userId];
  }
}

module.exports = MessengerFlow;
