# Monopoly Game - Multiplayer Setup

## Server is Now Running! ✅

Your Node.js WebSocket server is running at:
- **Local**: http://localhost:8000
- **Network (from laptop)**: http://192.168.56.1:8000

## How to Play Multiplayer:

### On Your PC:
1. Open http://localhost:8000
2. Select your token (2-6 players)
3. Click "Start Game"

### On Your Laptop:
1. Open http://192.168.56.1:8000 (same address as before)
2. You'll see the same token selections as the PC - **they're now synced!**
3. Both devices see each other's selections in real-time
4. When someone clicks a token, all devices update instantly

## Features:

✅ **Real-time Synchronization**
- Token selections sync across all connected devices
- Dice rolls visible to all players
- Token positions update live
- Turn management synchronized

✅ **Turn-Based System**
- 2-6 players can play
- Automatic turn rotation
- Only current player can roll dice
- All players see whose turn it is

✅ **Token-Specific Animations**
- Helicopter: Hovers and flies with arc animation
- Other tokens: Slide smoothly to destination

## Technical Details:

- **Server**: Node.js with WebSocket (ws library)
- **Frontend**: Three.js + Cannon.js physics
- **Communication**: Real-time WebSocket messages
- **Port**: 8000

## Troubleshooting:

If you don't see the laptop syncing:
1. Make sure both devices are on the same WiFi network
2. Confirm the laptop can ping http://192.168.56.1:8000
3. Check that the Node.js server is still running (you should see "Waiting for players to connect...")

## To Stop the Server:

Press Ctrl+C in the terminal where the server is running.

## To Restart the Server:

Run: `npm start`
