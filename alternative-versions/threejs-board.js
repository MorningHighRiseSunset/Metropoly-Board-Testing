// Three.js Monopoly Board Implementation

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Re-export for window access
window.THREE = THREE;
window.GLTFLoader = GLTFLoader;

let scene, camera, renderer;

async function initScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe8e8e8);

    // Create camera with proper isometric-like perspective
    camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    // Position camera to match CSS 3D isometric view (rotateX(60deg) rotateZ(-45deg))
    camera.position.set(14, 12, 14);
    camera.lookAt(0, 0, 0);

    // Create renderer
    const container = document.getElementById('token-container');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xe8e8e8);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting - bright ambient to match original
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Initialize loaders
    const loader = new GLTFLoader();
    
    // Load tokens
    const tokens = {
        'tophat': '../Models/TopHat/tophat.glb',
        'shoe': '../Models/Shoe/shoe.glb',
        'cheeseburger': '../Models/Cheeseburger/cheeseburger.glb',
        'helicopter': '../Models/Helicopter/helicopter.glb',
        'football': '../Models/Football/football.glb',
        'rollsroyce': '../Models/RollsRoyce/rollsRoyceCarAnim.glb'
    };

    const loadedTokens = {};
    for (const [name, path] of Object.entries(tokens)) {
        try {
            const gltf = await new Promise((resolve, reject) => {
                loader.load(path, resolve, undefined, reject);
            });
            loadedTokens[name] = gltf;
            console.log(`Loaded token: ${name}`);
        } catch (error) {
            console.warn(`Failed to load token ${name}:`, error);
        }
    }

    // Store tokens globally for spawning
    window.loadedTokens = loadedTokens;
    window.scene = scene;
    window.THREE = THREE;

    // Create the board
    createBoard();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Render loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    console.log('Three.js Board initialized!');
}

function createBoard() {
    const boardSize = 8;
    const cornerSize = 1;
    const numSlivers = 9;
    const sliverLength = (boardSize - 2 * cornerSize) / numSlivers;

    const tileNames = {
        0: 'GO', 10: 'JAIL', 20: 'FREE PARKING', 30: 'GO TO JAIL'
    };

    // Create all 40 tiles
    const tiles = [];

    // Corner tiles
    const corners = [
        { pos: new THREE.Vector3(boardSize/2 - cornerSize/2, 0, boardSize/2 - cornerSize/2), name: 'GO', space: 0 },
        { pos: new THREE.Vector3(-boardSize/2 + cornerSize/2, 0, -boardSize/2 + cornerSize/2), name: 'FREE PARKING', space: 20 },
        { pos: new THREE.Vector3(boardSize/2 - cornerSize/2, 0, -boardSize/2 + cornerSize/2), name: 'JAIL', space: 10 },
        { pos: new THREE.Vector3(-boardSize/2 + cornerSize/2, 0, boardSize/2 - cornerSize/2), name: 'GO TO JAIL', space: 30 }
    ];

    // Create corner tiles
    corners.forEach(corner => {
        const geometry = new THREE.BoxGeometry(cornerSize, 0.1, cornerSize);
        const material = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
        const tile = new THREE.Mesh(geometry, material);
        tile.position.copy(corner.pos);
        tile.castShadow = true;
        tile.receiveShadow = true;

        tile.userData = {
            space: corner.space,
            name: corner.name,
            position: corner.pos.clone()
        };

        scene.add(tile);
        tiles.push(tile);
    });

    // Helper to create a regular tile
    function createTile(x, z, spaceNum) {
        const geometry = new THREE.BoxGeometry(sliverLength, 0.1, cornerSize);
        const material = new THREE.MeshLambertMaterial({ color: 0xf8f9fa });
        const tile = new THREE.Mesh(geometry, material);
        tile.position.set(x, 0, z);
        tile.castShadow = true;
        tile.receiveShadow = true;

        const tileName = tileNames[spaceNum] || `Tile ${spaceNum}`;
        tile.userData = {
            space: spaceNum,
            name: tileName,
            position: new THREE.Vector3(x, 0.05, z)
        };

        scene.add(tile);
        tiles.push(tile);
    }

    // Bottom row (spaces 1-9, right to left)
    for (let i = 1; i <= numSlivers; i++) {
        const x = boardSize/2 - cornerSize - (i-0.5)*sliverLength;
        const z = boardSize/2 - cornerSize/2;
        createTile(x, z, i);
    }

    // Left side (spaces 11-19, bottom to top)
    for (let i = 1; i <= numSlivers; i++) {
        const x = -boardSize/2 + cornerSize/2;
        const z = boardSize/2 - cornerSize - (i-0.5)*sliverLength;
        createTile(x, z, 10 + i);
    }

    // Top row (spaces 21-29, left to right)
    for (let i = 1; i <= numSlivers; i++) {
        const x = -boardSize/2 + cornerSize + (i-0.5)*sliverLength;
        const z = -boardSize/2 + cornerSize/2;
        createTile(x, z, 20 + i);
    }

    // Right side (spaces 31-39, top to bottom)
    for (let i = 1; i <= numSlivers; i++) {
        const x = boardSize/2 - cornerSize/2;
        const z = -boardSize/2 + cornerSize + (i-0.5)*sliverLength;
        createTile(x, z, 30 + i);
    }

    // Add raycasting for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    renderer.domElement.addEventListener('click', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(tiles);

        if (intersects.length > 0) {
            const tile = intersects[0].object;
            console.log(`Tile clicked: ${tile.userData.name} (space ${tile.userData.space})`);
            // You can add token spawning logic here
        }
    });

    console.log(`Board created with ${tiles.length} tiles`);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', initScene);
