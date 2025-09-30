const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create HTTP server for serving the webpage
const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store all connected clients
const clients = new Set();

wss.on('connection', function connection(ws) {
    console.log('New client connected');
    clients.add(ws);
    
    // Send welcome message to new client
    ws.send('Welcome to WebSocket server');
    
    ws.on('message', function incoming(data) {
        const message = data.toString();
        console.log('Received:', message);
        
        // Handle different types of messages
        if (message.startsWith('web:')) {
            // Message from webpage - broadcast to Unity clients
            const command = message.substring(4); // Remove 'web:' prefix
            console.log('Broadcasting to Unity:', command);
            
            // Send the clean command (without 'web:' prefix) to all OTHER clients
            clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(command);
                    console.log('Sent to Unity client:', command);
                }
            });
        } else {
            // Message from Unity or other clients
            console.log('Message from Unity client:', message);
        }
    });
    
    ws.on('close', function close() {
        console.log('Client disconnected');
        clients.delete(ws);
    });
    
    ws.on('error', function error(err) {
        console.error('WebSocket error:', err);
        clients.delete(ws);
    });
});

// Start the server
const PORT = 7000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
    console.log(`\n🌐 Access from other devices:`);
    console.log(`   Web: http://[YOUR_IP]:${PORT}`);
    console.log(`   WebSocket: ws://[YOUR_IP]:${PORT}`);
    console.log(`\n💡 Replace [YOUR_IP] with your computer's IP address`);
});