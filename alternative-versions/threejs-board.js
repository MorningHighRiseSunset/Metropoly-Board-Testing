// Three.js Monopoly Board Implementation

import * as THREE from 'three';
import { ThreeTokenLoader } from './threejs-tokenLoader.js';
import { ThreeTokenSelection } from './threejs-tokenSelection.js';

let scene, camera, renderer;

async function initScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdddddd);
    scene.fog = new THREE.Fog(0xdddddd, 50, 100);

    // Create camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 8, 10);
    camera.lookAt(0, 0, 0);

    // Create renderer
    const container = document.getElementById('token-container');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Initialize token loader
    await ThreeTokenLoader.loadAllTokens();

    // Initialize token selection
    ThreeTokenSelection.init(scene);

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
    const tileSize = (boardSize - 2 * cornerSize) / 9;

    const tileNames = {
        0: 'GO', 10: 'JAIL', 20: 'FREE PARKING', 30: 'GO TO JAIL'
    };

    const cornerPositions = [
        { pos: new THREE.Vector3(boardSize/2 - cornerSize/2, 0, boardSize/2 - cornerSize/2), name: 'GO', space: 0 },
        { pos: new THREE.Vector3(-boardSize/2 + cornerSize/2, 0, -boardSize/2 + cornerSize/2), name: 'FREE PARKING', space: 20 },
        { pos: new THREE.Vector3(boardSize/2 - cornerSize/2, 0, -boardSize/2 + cornerSize/2), name: 'JAIL', space: 10 },
        { pos: new THREE.Vector3(-boardSize/2 + cornerSize/2, 0, boardSize/2 - cornerSize/2), name: 'GO TO JAIL', space: 30 }
    ];

    // Create corner tiles
    cornerPositions.forEach(corner => {
        const geometry = new THREE.BoxGeometry(cornerSize, 0.1, cornerSize);
        const material = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
        const tile = new THREE.Mesh(geometry, material);
        tile.position.copy(corner.pos);
        tile.castShadow = true;
        tile.receiveShadow = true;

        // Store metadata
        tile.userData = {
            space: corner.space,
            name: corner.name,
            position: corner.pos.clone()
        };

        scene.add(tile);

        // Add click handler via raycaster
        tile.userData.clickHandler = () => {
            ThreeTokenSelection.setCurrentTile({
                spaceNum: corner.space,
                name: corner.name,
                position: corner.pos.clone()
            });
            console.log(`Tile clicked: ${corner.name} (space ${corner.space})`);
        };
    });

    // Add raycasting for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    renderer.domElement.addEventListener('click', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children);

        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object.userData.clickHandler) {
                intersects[i].object.userData.clickHandler();
                break;
            }
        }
    });

    console.log('Board created with 4 corner tiles');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', initScene);
