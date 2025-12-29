// Babylon.js Monopoly Board Implementation

let scene, camera, engine;

async function initScene() {
    try {
        const canvas = document.getElementById('renderCanvas');
        
        if (!canvas) {
            console.error('Canvas not found!');
            return;
        }

        // Create engine with error handling
        engine = new BABYLON.Engine(canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });

        // Create scene
        scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.9, 0.9, 0.9);
        
        // Setup camera
        camera = new BABYLON.ArcRotateCamera(
            'camera',
            BABYLON.Tools.ToRadians(-45),
            BABYLON.Tools.ToRadians(60),
            40,
            BABYLON.Vector3.Zero(),
            scene
        );
        camera.attachControl(canvas, true);
        camera.wheelPrecision = 50;
        camera.lowerRadiusLimit = 20;
        camera.upperRadiusLimit = 100;

        // Lighting
        const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
        light1.intensity = 0.8;

        const light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(5, 10, 5), scene);
        light2.intensity = 0.6;

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
    const tileSize = (boardSize - 2 * cornerSize) / 9;

    const tileNames = {
        0: 'GO', 10: 'JAIL', 20: 'FREE PARKING', 30: 'GO TO JAIL'
    };

    const cornerPositions = [
        { pos: { x: boardSize/2 - cornerSize/2, z: boardSize/2 - cornerSize/2 }, name: 'GO', space: 0 },
        { pos: { x: -boardSize/2 + cornerSize/2, z: -boardSize/2 + cornerSize/2 }, name: 'FREE PARKING', space: 20 },
        { pos: { x: boardSize/2 - cornerSize/2, z: -boardSize/2 + cornerSize/2 }, name: 'JAIL', space: 10 },
        { pos: { x: -boardSize/2 + cornerSize/2, z: boardSize/2 - cornerSize/2 }, name: 'GO TO JAIL', space: 30 }
    ];

    // Create corner tiles
    cornerPositions.forEach(corner => {
        const tile = BABYLON.MeshBuilder.CreateBox('corner_' + corner.space, {
            size: cornerSize, height: 0.1
        }, scene);
        tile.position.x = corner.pos.x;
        tile.position.z = corner.pos.z;
        tile.position.y = 0;

        const material = new BABYLON.StandardMaterial('mat_' + corner.space, scene);
        material.diffuse = new BABYLON.Color3(0.95, 0.95, 0.95);
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        tile.material = material;

        // Store tile data
        tile.metadata = {
            space: corner.space,
            name: corner.name,
            position: tile.position
        };

        // Click handler
        tile.actionManager = new BABYLON.ActionManager(scene);
        tile.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                BabylonTokenSelection.setCurrentTile({
                    spaceNum: corner.space,
                    name: corner.name,
                    position: new BABYLON.Vector3(corner.pos.x, 1, corner.pos.z)
                });
                console.log(`Tile clicked: ${corner.name} (space ${corner.space})`);
            })
        );
    });

    // Create regular tiles (simplified - just corners for now)
    // You can expand this to create all 40 tiles

    console.log('Board created with 4 corner tiles');
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', initScene);
