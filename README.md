# MessengerFlow

A simple, extensible Facebook Messenger API wrapper and conversation manager for Node.js Messenger bots, inspired by BootBot.

## Features
- Easy webhook setup for Messenger verification and message handling
- Send messages, quick replies, and manage user conversations
- Keyword/regex-based message handling with `.hear`
- Event-based handling with `.on` (e.g., message, postback)
- Built-in conversation flow management (ask, say, context, end)
- User profile fetching
- Robust error handling

## Installation

Install from your local path (or from npm if published):

```sh
npm install messenger-flow
```

## Usage

### 1. Basic Setup

```js
const MessengerFlow = require('messenger-flow');

const bot = new MessengerFlow({
  accessToken: 'YOUR_PAGE_ACCESS_TOKEN',
  verifyToken: 'YOUR_VERIFY_TOKEN',
  appSecret: 'YOUR_APP_SECRET', // optional, for advanced use
  webhook: '/webhook' // optional, default is '/webhook'
});

bot.start(3000); // Start server on port 3000
```

### 2. Handling Messages and Events

#### Keyword/Regex Handling
```js
bot.hear(['hi', 'hello', /hey/i], (event, chat) => {
  chat.say('Hello! How can I help you?');
});
```

#### Event Handling
```js
bot.on('message', (event, chat, { captured }) => {
  if (!captured) chat.say('I did not understand that.');
});
bot.on('postback', (event, chat) => {
  chat.say('You clicked a button!');
});
```

### 3. Conversations

```js
bot.hear('survey', (event, chat) => {
  chat.conversation(convo => {
    convo.ask('What is your name?', async (event, convo) => {
      convo.set('name', event.message.text);
      await convo.say(`Nice to meet you, ${convo.get('name')}!`);
      convo.ask('How old are you?', async (event, convo) => {
        convo.set('age', event.message.text);
        await convo.say(`You are ${convo.get('age')} years old.`);
        convo.end();
      });
    });
  });
});
```

### 4. Sending Messages and Quick Replies

```js
bot.say(USER_ID, 'Hello!');
bot.say(USER_ID, {
  text: 'Choose an option:',
  quick_replies: [
    { content_type: 'text', title: 'Option 1', payload: 'OPTION_1' },
    { content_type: 'text', title: 'Option 2', payload: 'OPTION_2' }
  ]
});
// Or with options:
bot.say(USER_ID, 'Pick one:', {
  quickReplies: [
    { content_type: 'text', title: 'Yes', payload: 'YES' },
    { content_type: 'text', title: 'No', payload: 'NO' }
  ]
});
```

### 5. Fetching User Profile

```js
bot.getUserProfile(USER_ID).then(profile => {
  console.log(profile);
});
```

## API Reference

### MessengerFlow(options)
- `accessToken` (string, required): Facebook Page Access Token
- `verifyToken` (string, required): Token for webhook verification
- `appSecret` (string, optional): Facebook App Secret
- `webhook` (string, optional): Webhook endpoint path (default: `/webhook`)

### Methods
- `start(port)`: Start the Express server
- `hear(keywords, callback)`: Listen for keywords/regex in messages
- `on(event, callback)`: Listen for Messenger events (e.g., 'message', 'postback')
- `say(userId, message, opts)`: Send a message to a user
- `getUserProfile(userId)`: Fetch user profile info
- `conversation(userId, factory)`: Start a conversation with a user

### Conversation API
- `ask(question, answer)`: Ask a question and handle the answer
- `say(message)`: Send a message in the conversation
- `set(key, value)`: Store data in conversation context
- `get(key)`: Retrieve data from context
- `end()`: End the conversation

## Example: Full Bot

```js
const MessengerFlow = require('messenger-flow');
const bot = new MessengerFlow({
  accessToken: 'PAGE_TOKEN',
  verifyToken: 'VERIFY_TOKEN',
});
bot.hear('hi', (event, chat) => chat.say('Hello!'));
bot.on('message', (event, chat, { captured }) => {
  if (!captured) chat.say('Type "hi" to start!');
});
bot.start(3000);
```

## License

MIT
