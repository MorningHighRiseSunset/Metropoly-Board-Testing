// Babylon.js Monopoly Board Implementation

let scene, camera, engine;

async function initScene() {
    try {
        const canvas = document.getElementById('renderCanvas');
        
        if (!canvas) {
            console.error('Canvas not found!');
            return;
        }

        // Create engine
        engine = new BABYLON.Engine(canvas, true);

        // Create scene
        scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.91, 0.91, 0.91);
        
        // Setup camera with isometric-like view (matching CSS 3D transforms)
        camera = new BABYLON.ArcRotateCamera(
            'camera',
            BABYLON.Tools.ToRadians(-45),
            BABYLON.Tools.ToRadians(60),
            28,
            BABYLON.Vector3.Zero(),
            scene
        );
        camera.attachControl(canvas, true);
        camera.wheelPrecision = 50;
        camera.lowerRadiusLimit = 15;
        camera.upperRadiusLimit = 60;
        camera.angularSensibilityX = 1000;
        camera.angularSensibilityY = 1000;

        // Lighting - bright and even to match original board
        const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
        light1.intensity = 0.9;

        const light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(10, 15, 10), scene);
        light2.intensity = 0.5;

        // Initialize token loader
        await BabylonTokenLoader.init(scene);
        await BabylonTokenLoader.loadAllTokens();

        // Initialize token selection
        BabylonTokenSelection.init(scene);

        // Create the board
        createBoard();

        // Render loop
        engine.runRenderLoop(() => {
            scene.render();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            engine.resize();
        });

        console.log('Babylon.js Board initialized!');
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

function createBoard() {
    const boardSize = 8; // 3D units
    const cornerSize = 1; // 3D units
    const numSlivers = 9;
    const sliverLength = (boardSize - 2 * cornerSize) / numSlivers;

    const tileNames = {
        0: 'GO', 10: 'JAIL', 20: 'FREE PARKING', 30: 'GO TO JAIL'
    };

    const tiles = [];

    // Corner tiles first
    const corners = [
        { pos: { x: boardSize/2 - cornerSize/2, z: boardSize/2 - cornerSize/2 }, name: 'GO', space: 0 },
        { pos: { x: -boardSize/2 + cornerSize/2, z: -boardSize/2 + cornerSize/2 }, name: 'FREE PARKING', space: 20 },
        { pos: { x: boardSize/2 - cornerSize/2, z: -boardSize/2 + cornerSize/2 }, name: 'JAIL', space: 10 },
        { pos: { x: -boardSize/2 + cornerSize/2, z: boardSize/2 - cornerSize/2 }, name: 'GO TO JAIL', space: 30 }
    ];

    // Create corner tiles
    corners.forEach(corner => {
        const tile = BABYLON.MeshBuilder.CreateBox('corner_' + corner.space, {
            size: cornerSize, height: 0.1
        }, scene);
        tile.position.x = corner.pos.x;
        tile.position.z = corner.pos.z;
        tile.position.y = 0;

        const material = new BABYLON.StandardMaterial('mat_' + corner.space, scene);
        material.diffuse = new BABYLON.Color3(0.75, 0.75, 0.75);
        tile.material = material;

        tile.metadata = {
            space: corner.space,
            name: corner.name,
            position: tile.position.clone()
        };

        tiles.push(tile);

        tile.actionManager = new BABYLON.ActionManager(scene);
        tile.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                console.log(`Tile clicked: ${corner.name} (space ${corner.space})`);
            })
        );
    });

    // Helper to create regular tiles
    function createTile(x, z, spaceNum) {
        const tile = BABYLON.MeshBuilder.CreateBox(`tile_${spaceNum}`, {
            width: sliverLength, height: 0.1, depth: cornerSize
        }, scene);
        tile.position.x = x;
        tile.position.z = z;
        tile.position.y = 0;

        const material = new BABYLON.StandardMaterial(`tileMat_${spaceNum}`, scene);
        material.diffuse = new BABYLON.Color3(0.97, 0.97, 0.98);
        tile.material = material;

        const tileName = tileNames[spaceNum] || `Tile ${spaceNum}`;
        tile.metadata = {
            space: spaceNum,
            name: tileName,
            position: tile.position.clone()
        };

        tiles.push(tile);

        tile.actionManager = new BABYLON.ActionManager(scene);
        tile.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                console.log(`Tile clicked: ${tileName} (space ${spaceNum})`);
            })
        );
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

    console.log(`Board created with ${tiles.length} tiles`);
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', initScene);
