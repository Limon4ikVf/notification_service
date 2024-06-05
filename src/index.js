// Filename: index.js

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

// Initialize Express server
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected clients
let clients = [];

// Broadcast function to send message to all clients
const broadcast = (message) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

// Handle WebSocket connections
wss.on('connection', (ws) => {
  clients.push(ws);
  console.log('Client connected. Total clients:', clients.length);

  ws.on('message', (message) => {
    console.log('Received message:', message);
    broadcast({ type: 'broadcast', data: message });
  });

  ws.on('close', () => {
    clients = clients.filter((client) => client !== ws);
    console.log('Client disconnected. Total clients:', clients.length);
  });
});

// API endpoint to send notifications
app.post('/notify', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  broadcast({ type: 'notification', data: message });
  res.status(200).json({ success: true, message: 'Notification sent' });
});

// Serve a basic HTML file for testing
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WebSocket Notification Test</title>
    </head>
    <body>
      <h1>WebSocket Notification Test</h1>
      <input id="messageInput" type="text" placeholder="Enter message"/>
      <button onclick="sendMessage()">Send Message</button>
      <ul id="messages"></ul>
      <script>
        const ws = new WebSocket('ws://localhost:3000');
        
        ws.onmessage = (event) => {
          const messages = document.getElementById('messages');
          const message = document.createElement('li');
          message.textContent = event.data;
          messages.appendChild(message);
        };

        const sendMessage = () => {
          const input = document.getElementById('messageInput');
          ws.send(input.value);
          input.value = '';
        };
      </script>
    </body>
    </html>
  `);
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});