// Token Selection UI Module with Three.js

import { ThreeTokenLoader } from './threejs-tokenLoader.js';

export const ThreeTokenSelection = {
    selectedToken: null,
    spawnedTokens: [],
    currentTile: null,
    scene: null,
    tokenObjects: {},

    init(scene) {
        this.scene = scene;
        this.createTokenPanel();
    },

    createTokenPanel() {
        const panel = document.createElement('div');
        panel.className = 'token-panel';
        panel.innerHTML = `
            <div class="token-panel-header">
                <h2>Tokens</h2>
            </div>
            <div class="token-list"></div>
            <div class="spawn-button-container">
                <button class="spawn-button" id="spawn-token-btn">Spawn Token</button>
            </div>
            <div class="current-tile-info">Click a tile to select where to spawn</div>
            <div class="spawn-info"></div>
        `;
        document.body.appendChild(panel);

        const tokenList = panel.querySelector('.token-list');
        ThreeTokenLoader.getAllTokenNames().forEach(tokenName => {
            const btn = document.createElement('button');
            btn.className = 'token-btn';
            btn.textContent = tokenName.charAt(0).toUpperCase() + tokenName.slice(1);
            btn.dataset.token = tokenName;
            btn.addEventListener('click', () => this.selectToken(tokenName, btn));
            tokenList.appendChild(btn);
        });

        const spawnBtn = document.getElementById('spawn-token-btn');
        spawnBtn.addEventListener('click', () => this.spawnToken());
    },

    selectToken(tokenName, buttonElement) {
        document.querySelectorAll('.token-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        buttonElement.classList.add('selected');
        this.selectedToken = tokenName;

        const infoDiv = document.querySelector('.spawn-info');
        infoDiv.innerHTML = `<p>Selected: <strong>${tokenName}</strong></p>`;
    },

    setCurrentTile(tileInfo) {
        this.currentTile = tileInfo;
        const tileInfoDiv = document.querySelector('.current-tile-info');
        tileInfoDiv.innerHTML = `Tile: <strong>${tileInfo.name}</strong> (space ${tileInfo.spaceNum})`;
    },

    spawnToken() {
        if (!this.selectedToken) {
            alert('Please select a token first');
            return;
        }

        if (!this.currentTile) {
            alert('Please click on a board tile to select spawn location');
            return;
        }

        const tokenModel = ThreeTokenLoader.getToken(this.selectedToken);
        if (!tokenModel) {
            console.error('Token model not loaded:', this.selectedToken);
            return;
        }

        const tokenData = {
            name: this.selectedToken,
            spawnedAt: new Date().toISOString(),
            position: this.currentTile.position,
            tileInfo: {
                spaceNum: this.currentTile.spaceNum,
                name: this.currentTile.name
            },
            id: `token-${Date.now()}`
        };

        this.spawnedTokens.push(tokenData);

        // Clone the token
        const clonedToken = ThreeTokenLoader.cloneToken(this.selectedToken);
        if (!clonedToken) {
            console.error('Failed to clone token model');
            return;
        }

        // Position the token
        const offsetZ = this.spawnedTokens.length - 1;
        clonedToken.position.copy(this.currentTile.position);
        clonedToken.position.y = 0.5 + offsetZ * 0.1;
        clonedToken.position.z += 0.5 + offsetZ * 0.1;
        clonedToken.scale.set(0.8, 0.8, 0.8);

        this.scene.add(clonedToken);

        this.tokenObjects[tokenData.id] = {
            name: this.selectedToken,
            mesh: clonedToken,
            data: tokenData
        };

        console.log(`Token spawned: ${this.selectedToken} at ${tokenData.tileInfo.name} (space ${tokenData.tileInfo.spaceNum})`);

        const infoDiv = document.querySelector('.spawn-info');
        infoDiv.innerHTML = `
            <p>Last spawned: <strong>${this.selectedToken}</strong></p>
            <p>on: <strong>${tokenData.tileInfo.name}</strong></p>
            <p>Total: ${this.spawnedTokens.length}</p>
        `;
    },

    getSpawnedTokens() {
        return this.spawnedTokens;
    },

    removeToken(tokenId) {
        const index = this.spawnedTokens.findIndex(t => t.id === tokenId);
        if (index > -1) {
            this.spawnedTokens.splice(index, 1);
        }

        if (this.tokenObjects[tokenId]) {
            this.scene.remove(this.tokenObjects[tokenId].mesh);
            delete this.tokenObjects[tokenId];
        }
    }
};

// Export to window
window.ThreeTokenSelection = ThreeTokenSelection;
