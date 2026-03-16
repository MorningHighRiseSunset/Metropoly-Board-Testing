const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const url = require('url');


const os = require('os');
const PORT = 8000;

function getLocalExternalIPv4() {
  const interfaces = os.networkInterfaces();
  let preferredIP = null;
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168.')) {
        // Prefer non-VirtualBox host-only IPs (not 192.168.56.x)
        if (!iface.address.startsWith('192.168.56.')) {
          return iface.address;
        }
        preferredIP = iface.address; // fallback to host-only if no other
      }
    }
  }
  return preferredIP;
}

// Lobby system - multiple lobbies with max 4 players each
let lobbies = new Map(); // lobbyId -> { players: [], gameState: {...} }
let clientToLobby = new Map(); // ws -> lobbyId
let clientToPlayerName = new Map(); // ws -> playerName
let nextLobbyId = 1;

// Build a lightweight summary of all lobbies for lobby UI
function getLobbySummary() {
  const summary = [];
  for (const [lobbyId, lobby] of lobbies.entries()) {
    summary.push({
      lobbyId,
      playerCount: lobby.players.length,
      maxPlayers: lobby.maxPlayers,
      players: lobby.players.map((p, index) => ({
        name: p.name,
        index,
        isHost: index === 0
      })),
      gameStarted: !!lobby.gameState?.gameStarted
    });
  }
  return summary;
}

// Helper function to create a new lobby
function createLobby() {
  const lobbyId = `lobby_${nextLobbyId++}`;
  lobbies.set(lobbyId, {
    players: [],
    maxPlayers: 4,
    gameState: {
      selectedPlayers: [],
      gameStarted: false,
      currentPlayerIndex: 0,
      tokenPositions: {},
      diceResult: null,
      players: [],
      playerMoney: {},
      propertyOwners: {}
    }
  });
  return lobbyId;
}

// Helper function to find or create a lobby for a new player
function findAvailableLobby() {
  for (const [lobbyId, lobby] of lobbies.entries()) {
    if (lobby.players.length < lobby.maxPlayers && !lobby.gameState.gameStarted) {
      return lobbyId;
    }
  }
  return createLobby(); // Create new lobby if none available
}

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
  console.log(`✅ New connection from ${clientIp}. Total connections: ${wss.clients.size}`);
  
  // Send initial message asking for player name
  try {
    ws.send(JSON.stringify({
      type: 'requestPlayerName'
    }));
    // Also send current lobby summary so new tabs immediately see existing hosts
    ws.send(JSON.stringify({
      type: 'lobbySummary',
      lobbies: getLobbySummary()
    }));
  } catch (err) {
    console.error('Error requesting player name:', err.message);
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`📨 Message from ${clientIp}:`, data.type);
      
      switch(data.type) {
        case 'joinLobby':
          // Player wants to join a lobby with their name
          const playerName = data.playerName?.trim();
          if (!playerName) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Player name is required'
            }));
            return;
          }

          // Check if name is already taken in any lobby
          let nameTaken = false;
          for (const [lobbyId, lobby] of lobbies.entries()) {
            if (lobby.players.some(p => p.name === playerName)) {
              nameTaken = true;
              break;
            }
          }

          if (nameTaken) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'This name is already taken. Please choose another.'
            }));
            return;
          }

          // Find or create an available lobby
          const lobbyId = findAvailableLobby();
          const lobby = lobbies.get(lobbyId);
          
          // Add player to lobby
          const playerData = {
            name: playerName,
            ws: ws,
            playerIndex: lobby.players.length
          };
          lobby.players.push(playerData);
          
          // Update mappings
          clientToLobby.set(ws, lobbyId);
          clientToPlayerName.set(ws, playerName);
          
          console.log(`👤 ${playerName} joined ${lobbyId}. Players in lobby: ${lobby.players.length}/4`);
          
          // Send lobby info to player
          ws.send(JSON.stringify({
            type: 'lobbyJoined',
            lobbyId: lobbyId,
            playerName: playerName,
            playerIndex: playerData.playerIndex,
            players: lobby.players.map(p => ({ name: p.name, index: p.playerIndex })),
            maxPlayers: lobby.maxPlayers
          }));
          
          // Notify all players in lobby about the update
          broadcastToLobby(lobbyId, {
            type: 'playersUpdated',
            players: lobby.players.map(p => ({ name: p.name, index: p.playerIndex })),
            playerCount: lobby.players.length
          });
          // And broadcast global lobby summary so every tab sees the current host list
          broadcast({
            type: 'lobbySummary',
            lobbies: getLobbySummary()
          });
          
          break;

        case 'playerSelected':
          const playerLobbyId = clientToLobby.get(ws);
          if (!playerLobbyId) return;
          
          const playerLobby = lobbies.get(playerLobbyId);
          const playerGameState = playerLobby.gameState;
          
          // Player selected a token
          const tokenPlayerIndex = playerGameState.selectedPlayers.indexOf(data.token);
          if (tokenPlayerIndex > -1) {
            playerGameState.selectedPlayers.splice(tokenPlayerIndex, 1);
          } else {
            playerGameState.selectedPlayers.push(data.token);
          }
          broadcastToLobby(playerLobbyId, {
            type: 'playersUpdated',
            selectedPlayers: playerGameState.selectedPlayers
          });
          break;

        case 'startGame':
          const startLobbyId = clientToLobby.get(ws);
          if (!startLobbyId) return;
          
          const startLobby = lobbies.get(startLobbyId);
          const startGameState = startLobby.gameState;
          
          startGameState.gameStarted = true;
          startGameState.currentPlayerIndex = 0;
          startGameState.players = startGameState.selectedPlayers.map(token => ({
            token,
            currentSpace: 0,
            name: token
          }));
          
          // Initialize playerMoney for each player
          startGameState.playerMoney = {};
          startGameState.selectedPlayers.forEach(name => {
            startGameState.playerMoney[name] = 1500;
          });
          
          // Broadcast to all clients in lobby with their player index
          startLobby.players.forEach((playerData) => {
            if (playerData.ws.readyState === WebSocket.OPEN) {
              playerData.ws.send(JSON.stringify({
                type: 'gameStarted',
                gameState: startGameState,
                yourPlayerIndex: playerData.playerIndex
              }));
            }
          });
          break;
        case 'moneyUpdated':
          const moneyLobbyId = clientToLobby.get(ws);
          if (!moneyLobbyId) return;
          
          const moneyLobby = lobbies.get(moneyLobbyId);
          // { playerName, newBalance }
          if (data.playerName && typeof data.newBalance === 'number') {
            moneyLobby.gameState.playerMoney[data.playerName] = data.newBalance;
            broadcastToLobby(moneyLobbyId, {
              type: 'moneyUpdated',
              playerName: data.playerName,
              newBalance: data.newBalance,
              allMoney: moneyLobby.gameState.playerMoney
            });
          }
          break;

        case 'propertyPurchased':
          const propLobbyId = clientToLobby.get(ws);
          if (!propLobbyId) return;
          
          const propLobby = lobbies.get(propLobbyId);
          // { spaceNumber, ownerName }
          if (typeof data.spaceNumber === 'number' && data.ownerName) {
            propLobby.gameState.propertyOwners[data.spaceNumber] = data.ownerName;
            broadcastToLobby(propLobbyId, {
              type: 'propertyPurchased',
              spaceNumber: data.spaceNumber,
              ownerName: data.ownerName,
              propertyOwners: propLobby.gameState.propertyOwners
            });
          }
          break;

        case 'diceRolled':
          const diceLobbyId = clientToLobby.get(ws);
          if (!diceLobbyId) return;
          
          const diceLobby = lobbies.get(diceLobbyId);
          // Validate that it's this client's turn before accepting the roll
          const playerIdx = diceLobby.players.findIndex(p => p.ws === ws);
          if (playerIdx !== undefined && playerIdx === diceLobby.gameState.currentPlayerIndex) {
            diceLobby.gameState.diceResult = data.result;
            broadcastToLobby(diceLobbyId, {
              type: 'diceRolled',
              result: data.result,
              rollerIndex: playerIdx
            });
          } else {
            console.log(`⚠️ Invalid dice roll from player ${playerIdx} (current turn: ${diceLobby.gameState.currentPlayerIndex})`);
          }
          break;

        case 'minigameWin':
          const miniLobbyId = clientToLobby.get(ws);
          if (!miniLobbyId) return;
          
          // Broadcast so other players see "X won $Y in the slots!" popup
          if (data.playerName && typeof data.amount === 'number' && data.amount > 0) {
            broadcastToLobby(miniLobbyId, {
              type: 'minigameWin',
              playerName: data.playerName,
              amount: data.amount,
              game: data.game || 'slots'
            });
          }
          break;

        case 'tokenMoved':
          const tokenLobbyId = clientToLobby.get(ws);
          if (!tokenLobbyId) return;
          
          const tokenLobby = lobbies.get(tokenLobbyId);
          // Update token position
          if (!tokenLobby.gameState.tokenPositions[data.tokenName]) {
            tokenLobby.gameState.tokenPositions[data.tokenName] = {};
          }
          tokenLobby.gameState.tokenPositions[data.tokenName] = {
            space: data.space,
            x: data.x,
            y: data.y,
            z: data.z
          };
          broadcastToLobby(tokenLobbyId, {
            type: 'tokenMoved',
            moveId: data.moveId,
            tokenName: data.tokenName,
            space: data.space,
            x: data.x,
            y: data.y,
            z: data.z
          });
          break;

        case 'nextTurn':
          const turnLobbyId = clientToLobby.get(ws);
          if (!turnLobbyId) return;
          
          const turnLobby = lobbies.get(turnLobbyId);
          turnLobby.gameState.currentPlayerIndex = (turnLobby.gameState.currentPlayerIndex + 1) % turnLobby.gameState.selectedPlayers.length;
          broadcastToLobby(turnLobbyId, {
            type: 'turnChanged',
            currentPlayerIndex: turnLobby.gameState.currentPlayerIndex
          });
          break;

        case 'reset':
          const resetLobbyId = clientToLobby.get(ws);
          if (!resetLobbyId) return;
          
          const resetLobby = lobbies.get(resetLobbyId);
          resetLobby.gameState = {
            selectedPlayers: [],
            gameStarted: false,
            currentPlayerIndex: 0,
            tokenPositions: {},
            diceResult: null,
            players: [],
            playerMoney: {},
            propertyOwners: {}
          };
          broadcastToLobby(resetLobbyId, {
            type: 'gameReset'
          });
          broadcast({
            type: 'lobbySummary',
            lobbies: getLobbySummary()
          });
          break;
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  ws.on('close', () => {
    const lobbyId = clientToLobby.get(ws);
    const playerName = clientToPlayerName.get(ws);
    
    if (lobbyId && playerName) {
      const lobby = lobbies.get(lobbyId);
      if (lobby) {
        // Remove player from lobby
        lobby.players = lobby.players.filter(p => p.ws !== ws);
        
        // Update player indices for remaining players
        lobby.players.forEach((player, index) => {
          player.playerIndex = index;
        });
        
        console.log(`❌ ${playerName} left ${lobbyId}. Players in lobby: ${lobby.players.length}/4`);
        
        // Notify remaining players in lobby
        if (lobby.players.length > 0) {
          broadcastToLobby(lobbyId, {
            type: 'playersUpdated',
            players: lobby.players.map(p => ({ name: p.name, index: p.playerIndex })),
            playerCount: lobby.players.length
          });
        } else {
          // Remove empty lobby
          lobbies.delete(lobbyId);
          console.log(`🗑️ Removed empty lobby ${lobbyId}`);
        }

        // After any join/leave, update global lobby summary for all tabs
        broadcast({
          type: 'lobbySummary',
          lobbies: getLobbySummary()
        });
      }
    }
    
    clientToLobby.delete(ws);
    clientToPlayerName.delete(ws);
    console.log(`❌ Disconnected from ${clientIp}. Total connections: ${wss.clients.size}`);
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

function broadcastToLobby(lobbyId, message) {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return;
  
  console.log(`📡 Broadcasting to ${lobbyId}: ${message.type} to ${lobby.players.length} player(s)`);
  const payload = JSON.stringify(message);
  lobby.players.forEach(playerData => {
    if (playerData.ws.readyState === WebSocket.OPEN) {
      playerData.ws.send(payload);
    }
  });
}


server.listen(PORT, '0.0.0.0', () => {
  const lanIP = getLocalExternalIPv4();
  console.log(`\n🎲 Monopoly Game Server running at:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  if (lanIP) {
    console.log(`   Network: http://${lanIP}:${PORT}`);
  } else {
    console.log(`   Network: <LAN IP not found>`);
  }
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
