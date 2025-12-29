// Token Selection UI Module with Three.js 3D Rendering
import * as THREE from 'three';

const TokenSelection = {
    selectedToken: null,
    spawnedTokens: [],
    currentTile: null,
    scene: null,
    camera: null,
    renderer: null,
    tokenObjects: {},

    init() {
        this.initThreeJS();
        this.createTokenPanel();
        this.setupTokenListeners();
        this.animate();
    },

    initThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);
        this.scene.fog = new THREE.Fog(0xffffff, 1000, 5000);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 10;

        // Create renderer
        const container = document.getElementById('token-container');
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xffffff, 0);
        container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    },

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate all spawned tokens
        Object.values(this.tokenObjects).forEach(tokenObj => {
            if (tokenObj.mesh) {
                tokenObj.mesh.rotation.y += 0.01;
            }
        });

        this.renderer.render(this.scene, this.camera);
    },

    createTokenPanel() {
        // Create left sidebar container
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

        // Populate token list
        const tokenList = panel.querySelector('.token-list');
        TokenLoader.getAllTokenNames().forEach(tokenName => {
            const btn = document.createElement('button');
            btn.className = 'token-btn';
            btn.textContent = tokenName.charAt(0).toUpperCase() + tokenName.slice(1);
            btn.dataset.token = tokenName;
            btn.addEventListener('click', () => this.selectToken(tokenName, btn));
            tokenList.appendChild(btn);
        });

        // Setup spawn button
        const spawnBtn = document.getElementById('spawn-token-btn');
        spawnBtn.addEventListener('click', () => this.spawnToken());
    },

    selectToken(tokenName, buttonElement) {
        // Update selected state
        document.querySelectorAll('.token-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        buttonElement.classList.add('selected');
        this.selectedToken = tokenName;

        const infoDiv = document.querySelector('.spawn-info');
        infoDiv.innerHTML = `<p>Selected: <strong>${tokenName}</strong></p>`;
    },

    spawnTokenAtGO() {
        if (!this.selectedToken) {
            alert('Please select a token first');
            return;
        }

        if (!this.currentTile) {
            alert('Please click on a board tile to select spawn location');
            return;
        }

        const tokenModel = TokenLoader.getToken(this.selectedToken);
        if (!tokenModel) {
            console.error('Token model not loaded:', this.selectedToken);
            return;
        }

        const tokenData = {
            name: this.selectedToken,
            spawnedAt: new Date().toISOString(),
            position: { ...this.currentTile.coords },
            tileInfo: {
                spaceNum: this.currentTile.spaceNum,
                name: this.currentTile.name
            },
            id: `token-${Date.now()}`
        };

        this.spawnedTokens.push(tokenData);

        // Clone the 3D model
        const clonedScene = TokenLoader.cloneToken(this.selectedToken);
        if (!clonedScene) {
            console.error('Failed to clone token model');
            return;
        }

        // Position token based on tile location relative to board center
        const rect = this.currentTile.rect;
        const boardSpaces = this.currentTile.element.parentElement;
        const boardRect = boardSpaces.getBoundingClientRect();
        
        // Get offset from board center
        const boardCenterX = boardRect.left + boardRect.width / 2;
        const boardCenterY = boardRect.top + boardRect.height / 2;
        const tileCenterX = rect.left + rect.width / 2;
        const tileCenterY = rect.top + rect.height / 2;
        
        const offsetX = tileCenterX - boardCenterX;
        const offsetY = tileCenterY - boardCenterY;
        
        // Scale to 3D world space - simpler direct mapping
        // The board is 800px, map to roughly -4 to 4 in 3D space
        clonedScene.scale.set(0.8, 0.8, 0.8);
        clonedScene.position.x = (offsetX / boardRect.width) * 8;
        clonedScene.position.y = 0.5 + (this.spawnedTokens.length - 1) * 0.1;  // On board surface, slight stack
        clonedScene.position.z = 0.5 + (this.spawnedTokens.length - 1) * 0.1;  // Visible above board

        this.scene.add(clonedScene);

        // Store reference to the 3D object
        this.tokenObjects[tokenData.id] = {
            name: this.selectedToken,
            mesh: clonedScene,
            data: tokenData
        };

        console.log(`Token spawned: ${this.selectedToken} at ${tokenData.tileInfo.name} (space ${tokenData.tileInfo.spaceNum})`);
        console.log('Spawned tokens:', this.spawnedTokens);

        // Update spawn info
        const infoDiv = document.querySelector('.spawn-info');
        infoDiv.innerHTML = `
            <p>Last spawned: <strong>${this.selectedToken}</strong></p>
            <p>on: <strong>${tokenData.tileInfo.name}</strong></p>
            <p>Total: ${this.spawnedTokens.length}</p>
        `;
    },

    spawnToken() {
        this.spawnTokenAtGO();
    },

    setupTokenListeners() {
        // No longer auto-spawn on GO click - using spawn button instead
        // This prevents multiple spawns from repeated clicks
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

// Export to window for use in other scripts
window.TokenSelection = TokenSelection;
