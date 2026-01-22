const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;

// Game state shared across all players
let gameState = {
  selectedPlayers: [],
  gameStarted: false,
  currentPlayerIndex: 0,
  tokenPositions: {},
  diceResult: null,
  players: []
};

// Track which client is which player for turn validation
let clientToPlayerMap = new Map(); // ws -> playerIndex

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(url.parse(req.url).pathname);
  
  // Skip WebSocket upgrade requests
  if (req.headers.upgrade) {
    return;
  }
  
  // Handle CORS and set proper headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log(`404 - Not found: ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + filePath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'text/html; charset=utf-8';
    if (ext === '.js') contentType = 'application/javascript; charset=utf-8';
    if (ext === '.css') contentType = 'text/css; charset=utf-8';
    if (ext === '.json') contentType = 'application/json';
    if (ext === '.glb' || ext === '.gltf') contentType = 'application/octet-stream';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    if (ext === '.mp4') contentType = 'video/mp4';
    if (ext === '.webm') contentType = 'video/webm';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server: server,
  clientTracking: true
});

console.log('🚀 WebSocket server created, waiting for HTTP server to start...');

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  const playerIndex = wss.clients.size - 1; // 0-indexed based on connection order
  clientToPlayerMap.set(ws, playerIndex);
  console.log(`✅ Player ${playerIndex + 1} connected from ${clientIp}. Total players: ${wss.clients.size}`);
  
  // Send current game state and this client's player index to new player
  try {
    ws.send(JSON.stringify({
      type: 'gameState',
      gameState: gameState,
      yourPlayerIndex: playerIndex
    }));
  } catch (err) {
    console.error('Error sending initial state:', err.message);
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`📨 Message from ${clientIp}:`, data.type);
      
      switch(data.type) {
        case 'playerSelected':
          // Player selected a token
          const playerIndex = gameState.selectedPlayers.indexOf(data.token);
          if (playerIndex > -1) {
            gameState.selectedPlayers.splice(playerIndex, 1);
          } else {
            gameState.selectedPlayers.push(data.token);
          }
          broadcast({
            type: 'playersUpdated',
            selectedPlayers: gameState.selectedPlayers
          });
          break;

        case 'startGame':
          gameState.gameStarted = true;
          gameState.currentPlayerIndex = 0;
          gameState.players = gameState.selectedPlayers.map(token => ({
            token,
            currentSpace: 0
          }));
          // Broadcast to all clients with each one's player index from clientToPlayerMap
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              const playerIdx = clientToPlayerMap.get(client);
              client.send(JSON.stringify({
                type: 'gameStarted',
                gameState: gameState,
                yourPlayerIndex: playerIdx
              }));
            }
          });
          break;

        case 'diceRolled':
          // Validate that it's this client's turn before accepting the roll
          const playerIdx = clientToPlayerMap.get(ws);
          if (playerIdx !== undefined && playerIdx === gameState.currentPlayerIndex) {
            gameState.diceResult = data.result;
            broadcast({
              type: 'diceRolled',
              result: data.result,
              rollerIndex: playerIdx  // Include who rolled so clients can skip animation for self
            });
          } else {
            console.log(`⚠️ Invalid dice roll from player ${playerIdx} (current turn: ${gameState.currentPlayerIndex})`);
          }
          break;

        case 'tokenMoved':
          // Update token position
          if (!gameState.tokenPositions[data.tokenName]) {
            gameState.tokenPositions[data.tokenName] = {};
          }
          gameState.tokenPositions[data.tokenName] = {
            space: data.space,
            x: data.x,
            y: data.y,
            z: data.z
          };
          broadcast({
            type: 'tokenMoved',
            tokenName: data.tokenName,
            space: data.space,
            x: data.x,
            y: data.y,
            z: data.z
          });
          break;

        case 'nextTurn':
          gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.selectedPlayers.length;
          broadcast({
            type: 'turnChanged',
            currentPlayerIndex: gameState.currentPlayerIndex
          });
          break;

        case 'reset':
          gameState = {
            selectedPlayers: [],
            gameStarted: false,
            currentPlayerIndex: 0,
            tokenPositions: {},
            diceResult: null,
            players: []
          };
          broadcast({
            type: 'gameReset'
          });
          break;
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  ws.on('close', () => {
    clientToPlayerMap.delete(ws);
    console.log(`❌ Player disconnected (${clientIp}). Total players: ${wss.clients.size}`);
  });

  ws.on('error', (error) => {
    console.error(`⚠️ WebSocket error (${clientIp}):`, error.message);
  });
});

wss.on('error', (error) => {
  console.error('⚠️ WebSocket Server error:', error.message);
});

function broadcast(message) {
  console.log(`📡 Broadcasting: ${message.type} to ${wss.clients.size} client(s)`);
  const payload = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎲 Monopoly Game Server running at:`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Network: http://192.168.0.111:${PORT} (or your PC's IP)`);
  console.log(`\n⏳ Waiting for players to connect...\n`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
  } else {
    console.error('❌ Server error:', error.message);
  }
  process.exit(1);
});
