# messenger-flow

Simple Facebook Messenger API wrapper and conversation manager for Node.js Messenger bots.

## Features
- Send messages to Facebook Messenger users
- Manage user conversation state
- Easily set up a Messenger webhook for receiving and responding to messages/events

## Installation

Install via npm (after publishing to npm):

```sh
npm install messenger-flow
```

Or use a local path:

```sh
npm install /path/to/messenger-flow
```

## Usage

### 1. Sending Messages

```js
const { MessengerClient } = require('messenger-flow');

const client = new MessengerClient('YOUR_PAGE_ACCESS_TOKEN');

client.sendMessage('RECIPIENT_ID', 'Hello from messenger-flow!')
  .then(response => console.log('Message sent:', response))
  .catch(err => console.error('Error:', err));
```

### 2. Managing Conversation State

```js
const { ConversationManager } = require('messenger-flow');

const convManager = new ConversationManager();

// Set user state
convManager.setUserState('USER_ID', { step: 1 });

// Get user state
const state = convManager.getUserState('USER_ID');

// Reset user state
convManager.resetUserState('USER_ID');
```

### 3. Setting Up a Messenger Webhook

```js
const express = require('express');
const bodyParser = require('body-parser');
const { MessengerClient, ConversationManager, createWebhookHandler } = require('messenger-flow');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = 'your_verify_token';
const PAGE_ACCESS_TOKEN = 'your_page_access_token';

const client = new MessengerClient(PAGE_ACCESS_TOKEN);
const convManager = new ConversationManager();

function handleMessage(event, req, res) {
  // Example: Echo received text
  const senderId = event.sender.id;
  if (event.message && event.message.text) {
    client.sendMessage(senderId, 'You said: ' + event.message.text);
  }
}

// Mount webhook at /webhook
app.use('/webhook', createWebhookHandler(VERIFY_TOKEN, handleMessage));

app.listen(3000, () => console.log('Server is running on port 3000'));
```

- Facebook will call your webhook for verification (GET) and for incoming messages/events (POST).
- The `handleMessage` callback receives each event, so you can process and respond as needed.

## License

MIT
