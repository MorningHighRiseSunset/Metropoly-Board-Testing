
// ========== VIDEO MODAL SYSTEM ==========
// TILE VIDEO MAPPING - Add your video URLs here by tile position (0-39)
// Can be a single string or array of strings for random selection
const tileVideos = {
    0: "",  // GO
    1: [  // Las Vegas Raiders
        "Videos/LVRaidersVid.mp4",
        "Videos/LVRaiders 2 (1).mp4",
        "Videos/LVRaiders 3 (1).mp4",
        "Videos/LVRaiders 4 (1).mp4",
        "Videos/LVRaiders 5 (1).mp4"
    ],
    2: "",  // Community Cards
    3: [  // Las Vegas Grand Prix
        "Videos/LV Grand Prix.mp4",
        "Videos/LV Grand Prix End (1).mp4"
    ],
    4: "",  // Income Tax
    5: "Videos/Monorail (1).mp4",  // Las Vegas Monorail
    6: "Videos/Offroading 1 (1).mp4",  // Speed Vegas Off Roading
    7: "",  // Chance
    8: [  // Las Vegas Golden Knights
        "Videos/LV GKnights 1 (1).mp4",
        "Videos/LV GKnights 2 (1).mp4",
        "Videos/LV GKnights 3 (1).mp4",
        "Videos/LV Golden Knights (1).mp4",
        "Videos/LV Golden Knights (2).mp4"
    ],
    9: [  // Maverick Helicopter Rides
        "Videos/MavHeli 1.mp4 (1).mp4",
        "Videos/MavHeli 2 (1).mp4",
        "Videos/MavHeli 3 (1).mp4"
    ],
    10: [  // JAIL
        "Videos/Jailclip4.mp4",
        "Videos/Jailclip5.mp4",
        "Videos/jailclip6.mp4_1743296163946.mp4",
        "Videos/Jailmoment2(cropped).mp4",
        "Videos/jailmoment3(cropped).mp4",
        "Videos/Imgoingtojail.mp4"
    ],
    11: "Videos/BrothelVid (1).mp4", // Brothel
    12: "",  // Electric Company
    13: [  // Bet MGM
        "Videos/MGMBoxing 1 (1).mp4",
        "Videos/MGM 2.mp4",
        "Videos/MGMBoxing 3 (1).mp4"
    ],
    14: "Videos/Monorail (1).mp4",  // Las Vegas Monorail
    15: "",  // Bellagio
    16: [  // Las Vegas Aces
        "Videos/WNBA (1).mp4",
        "Videos/WNBAHL2 (1).mp4",
        "Videos/WNBAHL3 (1).mp4",
        "Videos/WNBAHL4 (1).mp4"
    ],
    17: "",  // Community Cards
    18: "Videos/horse6 (1).mp4",  // Horseback Riding
    19: "",  // Resorts World Theatre
    20: "",  // FREE PARKING
    21: "",  // Chance
    22: "",  // Hard Rock Hotel
    23: "",  // Wynn Las Vegas
    24: [  // Shriners Children's Open
        "Videos/Shriners 1 (1).mp4",
        "Videos/Shriners 3 (1).mp4",
        "Videos/Shriners 4 (1).mp4"
    ],
    25: "",  // Bachelor & Bachelorette Parties
    26: "",  // Las Vegas Little White Wedding Chapel
    27: "Videos/Sphere (1).mp4",  // Sphere
    28: "",  // Community Cards
    29: "",  // Water Works
    30: "Videos/Imgoingtojail.mp4",  // GO TO JAIL
    31: "",  // Caesars Palace
    32: "",  // Santa Fe Hotel and Casino
    33: "",  // Chance
    34: "",  // Luxury Tax
    35: "",  // House of Blues
    36: "",  // The Cosmopolitan
    37: "",  // Community Cards
    38: "Videos/Monorail (1).mp4",  // Las Vegas Monorail
    39: [  // Shriners Children's Open
        "Videos/Shriners 1 (1).mp4",
        "Videos/Shriners 3 (1).mp4",
        "Videos/Shriners 4 (1).mp4"
    ]
};

// Removed showPropertyVideo function. Video is now shown in tileLandingUI only.

// Initialize the board and dynamically create spaces
document.addEventListener('DOMContentLoaded', function() {
    // --- 2D Tile Highlight Helper ---
    window.highlight2DTile = function(spaceNumber) {
        // Remove highlight from all tiles
        document.querySelectorAll('.space.highlighted').forEach(el => el.classList.remove('highlighted'));
        // Add highlight to the current tile
        const tile = document.querySelector(`.space[data-space="${spaceNumber}"]`);
        if (tile) tile.classList.add('highlighted');
    };
    const board = document.querySelector('.board-3d');
    // Ensure board starts in 3D view
    board.style.transform = `rotateX(60deg) rotateZ(-45deg)`;
    const boardSpaces = document.querySelector('.board-spaces');
    
    // Create 3D board structure with sides
    const boardSize = 800;
    const boardThickness = 20; // Thickness of the board edges
    
    // Create board sides for 3D effect
    function createBoardSide(position, width, height, depth, transform) {
        const side = document.createElement('div');
        side.className = 'board-side board-side-' + position;
        side.style.cssText = `
            position: absolute;
            width: ${width}px;
            height: ${height}px;
            background: linear-gradient(135deg, #1a252f 0%, #2c3e50 100%);
            border: 2px solid #0f1419;
            transform-style: preserve-3d;
            ${transform}
        `;
        return side;
    }
    
    // Top edge
    const topEdge = createBoardSide('top', boardSize, boardThickness, boardThickness, 
        `top: -${boardThickness}px; left: 0; transform: rotateX(-90deg) translateZ(${boardThickness/2}px); transform-origin: bottom center;`);
    board.appendChild(topEdge);
    
    // Bottom edge
    const bottomEdge = createBoardSide('bottom', boardSize, boardThickness, boardThickness,
        `bottom: -${boardThickness}px; left: 0; transform: rotateX(90deg) translateZ(${boardThickness/2}px); transform-origin: top center;`);
    board.appendChild(bottomEdge);
    
    // Left edge
    const leftEdge = createBoardSide('left', boardThickness, boardSize, boardThickness,
        `left: -${boardThickness}px; top: 0; transform: rotateY(90deg) translateZ(${boardThickness/2}px); transform-origin: right center;`);
    board.appendChild(leftEdge);
    
    // Right edge
    const rightEdge = createBoardSide('right', boardThickness, boardSize, boardThickness,
        `right: -${boardThickness}px; top: 0; transform: rotateY(-90deg) translateZ(${boardThickness/2}px); transform-origin: left center;`);
    board.appendChild(rightEdge);
    
    // Bottom face (under the board)
    const bottomFace = document.createElement('div');
    bottomFace.className = 'board-bottom';
    bottomFace.style.cssText = `
        position: absolute;
        width: ${boardSize}px;
        height: ${boardSize}px;
        top: 0;
        left: 0;
        background: linear-gradient(135deg, #0f1419 0%, #1a252f 100%);
        transform: translateZ(-${boardThickness}px);
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
    `;
    board.appendChild(bottomFace);

    // Helper to create a space
    function createSpace(classNames, dataSpace) {
        const div = document.createElement('div');
        div.className = 'space ' + classNames;
        if (dataSpace) div.setAttribute('data-space', dataSpace);
        return div;
    }

    // Board and tile sizing (boardSize already defined above)
    const cornerSize = 98; // px (matches .space.corner in CSS)
    const numSlivers = 9;
    const sliverLength = (boardSize - 2 * cornerSize) / numSlivers;

    // Place corners at true corners
    const corners = [
        { class: 'corner space-go', style: 'bottom:0;right:0;', data: 0 },
        { class: 'corner space-parking', style: 'top:0;left:0;', data: 20 },
        { class: 'corner space-jail', style: 'top:0;right:0;', data: 10 },
        { class: 'corner space-go-jail', style: 'bottom:0;left:0;', data: 30 }
    ];
    corners.forEach(corner => {
        // Cosmetic base tile (no event handlers, not interactive)
        const base = document.createElement('div');
        base.className = 'space corner-cosmetic';
        base.style.cssText += corner.style + 'z-index:0; background:#b0b0b0; position:absolute; width:' + cornerSize + 'px; height:' + cornerSize + 'px;';
        boardSpaces.appendChild(base);
        // Top interactive tile
        const div = createSpace(corner.class);
        div.style.cssText += corner.style + 'z-index:1; background:#f8f9fa; position:absolute; width:' + cornerSize + 'px; height:' + cornerSize + 'px; transform:translateZ(20px);';
        // assign canonical data-space number for corners
        if (corner.data !== undefined) div.setAttribute('data-space', corner.data);
        // small accessibility hint
        div.setAttribute('role', 'button');
        
        // Add corner name label
        const cornerName = document.createElement('div');
        cornerName.className = 'corner-label';
        const nameMap = { 0: 'GO', 10: 'JAIL', 20: 'FREE\nPARKING', 30: 'GO TO\nJAIL' };
        cornerName.textContent = nameMap[corner.data] || '';
        cornerName.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;font-weight:bold;font-size:11px;line-height:1.2;width:100%;';
        div.appendChild(cornerName);
        
        boardSpaces.appendChild(div);
    });

    // Add bottom row (spaces 1-9, right to left)
    for (let i = 1; i <= numSlivers; i++) {
        const div = createSpace('space-bottom', i);
        div.style.top = '0';
        div.style.right = (cornerSize + (i-1)*sliverLength) + 'px';
        div.style.width = sliverLength + 'px';
        div.style.height = cornerSize + 'px';
        div.style.transform = 'none';
        boardSpaces.appendChild(div);
    }
    // Add left side (spaces 11-19, bottom to top)
    for (let i = 1; i <= numSlivers; i++) {
        const div = createSpace('space-left', 10+i);
        div.style.left = '0';
        div.style.top = (cornerSize + (i-1)*sliverLength) + 'px';
        div.style.width = cornerSize + 'px';
        div.style.height = sliverLength + 'px';
        div.style.transform = 'none';
        boardSpaces.appendChild(div);
    }
    // Add top row (spaces 21-29, left to right)
    for (let i = 1; i <= numSlivers; i++) {
        const div = createSpace('space-top', 20+i);
        div.style.bottom = '0';
        div.style.left = (cornerSize + (i-1)*sliverLength) + 'px';
        div.style.width = sliverLength + 'px';
        div.style.height = cornerSize + 'px';
        div.style.transform = 'none';
        boardSpaces.appendChild(div);
    }
    // Add right side (spaces 31-39, top to bottom)
    for (let i = 1; i <= numSlivers; i++) {
        const div = createSpace('space-right', 30+i);
        div.style.right = '0';
        div.style.bottom = (cornerSize + (i-1)*sliverLength) + 'px';
        div.style.width = cornerSize + 'px';
        div.style.height = sliverLength + 'px';
        div.style.transform = 'none';
        boardSpaces.appendChild(div);
    }

    // --- Tile names mapping and click/coordinate handler ---
    // Build name map from property names
    const tileNames = {
        0: 'GO',
        1: 'Las Vegas Raiders',
        2: 'Community Cards',
        3: 'Las Vegas Grand Prix',
        4: 'Income Tax',
        5: 'Las Vegas Monorail',
        6: 'Speed Vegas Off Roading',
        7: 'Chance',
        8: 'Las Vegas Golden Knights',
        9: 'Maverick Helicopter Rides',
        10: 'JAIL',
        11: 'Brothel',
        12: 'Electric Company',
        13: 'Bet MGM',
        14: 'Las Vegas Monorail',
        15: 'Bellagio',
        16: 'Las Vegas Aces',
        17: 'Community Cards',
        18: 'Horseback Riding',
        19: 'Resorts World Theatre',
        20: 'FREE PARKING',
        21: 'Chance',
        22: 'Hard Rock Hotel',
        23: 'Wynn Las Vegas',
        24: 'Shriners Children\'s Open',
        25: 'Bachelor & Bachelorette Parties',
        26: 'Las Vegas Little White Wedding Chapel',
        27: 'Sphere',
        28: 'Community Cards',
        29: 'Water Works',
        30: 'GO TO JAIL',
        31: 'Caesars Palace',
        32: 'Santa Fe Hotel and Casino',
        33: 'Chance',
        34: 'Luxury Tax',
        35: 'House of Blues',
        36: 'The Cosmopolitan',
        37: 'Community Cards',
        38: 'Las Vegas Monorail',
        39: 'Speed Vegas Off Roading'
    };
    
    // Expose to global scope for index.html to access
    window.tileNames = tileNames;
    window.tileVideos = tileVideos;

    // Create a GO sign element (fixed in viewport space)
    const goSign = document.createElement('div');
    goSign.className = 'go-sign';
    goSign.innerHTML = '<div class="go-sign-inner">GO</div>';
    // append to body because it's fixed-positioned
    document.body.appendChild(goSign);
    let goSignTimeout = null;
    function showGoSignAt(space) {
        if (!space) return;
        if (goSignTimeout) {
            clearTimeout(goSignTimeout);
            goSignTimeout = null;
        }
        // compute viewport center coords of the tile
        const rect = space.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const topOfTile = rect.top; // top edge in viewport coordinates
        // ensure the sign is visible for measuring
        goSign.classList.remove('show');
        goSign.style.opacity = '0';
        // measure sign size (offsetWidth is reliable even when opacity 0)
        const signW = goSign.offsetWidth || 140;
        const signH = goSign.offsetHeight || 64;
        // preferred placement: above the tile
        let left = Math.round(centerX - signW / 2);
        let top = Math.round(topOfTile - signH - 8); // place 8px above tile
        // If placing above would go off the top of the viewport, place below the tile instead
        if (top < 8) {
            top = Math.round(rect.bottom + 8);
        }
        // Clamp both values so the sign stays inside the viewport
        const minMargin = 8;
        const maxLeft = window.innerWidth - signW - minMargin;
        const maxTop = window.innerHeight - signH - minMargin;
        left = Math.min(Math.max(left, minMargin), Math.max(maxLeft, minMargin));
        top = Math.min(Math.max(top, minMargin), Math.max(maxTop, minMargin));
        goSign.style.left = left + 'px';
        goSign.style.top = top + 'px';
        // show with animation
        requestAnimationFrame(() => goSign.classList.add('show'));
        // auto-hide after 3s
        goSignTimeout = setTimeout(() => {
            goSign.classList.remove('show');
            goSignTimeout = setTimeout(() => { goSign.style.opacity = '0'; }, 220);
        }, 3000);
    }

    // Attach click handler to every interactive space (skip cosmetic)
    const allSpaces = boardSpaces.querySelectorAll('.space');
    allSpaces.forEach(space => {
        // ensure every space has a data-space attribute (if not, try to infer)
        let ds = space.getAttribute('data-space');
        if (ds === null) {
            // try to derive from classes like space-bottom, space-left, etc. Otherwise leave -1
            ds = '-1';
        }
        const dsNum = parseInt(ds, 10);
        const name = tileNames.hasOwnProperty(dsNum) ? tileNames[dsNum] : (dsNum > 0 ? ('Tile ' + dsNum) : (space.classList.contains('corner') ? 'Corner' : 'Unknown'));
        // set a title for hover and a data-name attribute
        space.setAttribute('title', name);
        space.setAttribute('data-name', name);
        
        // Add tile name/number text to the space (invisible but present)
        const nameLabel = document.createElement('div');
        nameLabel.className = 'tile-label';
        nameLabel.textContent = dsNum.toString();
        nameLabel.setAttribute('aria-label', name);
        space.appendChild(nameLabel);
        
        // Click -> log name and center coordinates
        space.addEventListener('click', function (e) {
            const rect = space.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            console.log('Tile clicked:', name, '(data-space:', dsNum + '), center coords:', Math.round(centerX) + ',' + Math.round(centerY));
            
            // If this is the GO tile (data-space 0) show the GO sign at viewport coords
            if (dsNum === 0) {
                showGoSignAt(space);
            }
        });
    });

    // Removed UI and event handlers for moving tiles

    // Mouse drag to rotate board
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let rotationX = 60;
    let rotationZ = -45;

    boardSpaces.addEventListener('mousedown', function(e) {
        // Only left mouse button
        if (e.button !== 0) return;
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        // Prevent text selection
        document.body.style.userSelect = 'none';
    });

    // Store rotation sync function globally so Three.js can access it
    window.syncThreeJSCamera = null;

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        rotationZ += deltaX * 0.5;
        rotationX += deltaY * 0.5;
        rotationX = Math.max(30, Math.min(90, rotationX));
        board.style.transform = `rotateX(${rotationX}deg) rotateZ(${rotationZ}deg)`;
        
        // Sync Three.js camera if available
        if (window.syncThreeJSCamera) {
            window.syncThreeJSCamera(rotationX, rotationZ);
        }
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
        document.body.style.userSelect = '';
    });

    // Optional: Prevent context menu on board
    boardSpaces.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    // Touch support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    boardSpaces.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            animating = true;
        }
    });
    boardSpaces.addEventListener('touchmove', function(e) {
        if (e.touches.length === 1) {
            const deltaX = e.touches[0].clientX - touchStartX;
            const deltaY = e.touches[0].clientY - touchStartY;
            targetRotationZ += deltaX * 0.5;
            targetRotationX += deltaY * 0.5;
            targetRotationX = Math.max(30, Math.min(90, targetRotationX));
            if (!animating) {
                animating = true;
                requestAnimationFrame(animateBoardRotation);
            }
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    });

    console.log('3D Board initialized!');
    console.log('Click and drag to rotate the board');
    console.log('Click on spaces to interact');

    // Initialize Three.js for 3D models on board
    async function initThreeJS() {
        try {
            const { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, Vector3, Mesh, SphereGeometry, MeshBasicMaterial } = await import('three');
            const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');

            const container = document.getElementById('three-container');
            if (!container) {
                console.error('Three.js container not found');
                return;
            }

            // Scene setup
            const scene = new Scene();
            const camera = new PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 2000);
            const renderer = new WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            container.appendChild(renderer.domElement);

            // Lighting
            const ambientLight = new AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);
            const directionalLight = new DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 10, 5);
            scene.add(directionalLight);

            // Store rotation values for syncing
            let threeRotationX = rotationX;
            let threeRotationZ = rotationZ;

            // Function to convert board space position to 3D coordinates
            function getSpace3DPosition(spaceNumber) {
                const boardSize = 800;
                const cornerSize = 98;
                const numSlivers = 9;
                const sliverLength = (boardSize - 2 * cornerSize) / numSlivers;
                const spaceZ = 20; // Tiles are at z=20px
                
                // Board is 800x800, centered at (0,0) in Three.js
                // So corners are at ±400
                const halfBoard = boardSize / 2;
                const halfCorner = cornerSize / 2;

                let x = 0, y = 0;

                if (spaceNumber === 0) {
                    // GO corner (bottom-right in CSS, which is +X, -Y in Three.js)
                    x = halfBoard - halfCorner;
                    y = -(halfBoard - halfCorner);
                } else if (spaceNumber === 10) {
                    // JAIL corner (top-right in CSS, which is +X, +Y in Three.js)
                    x = halfBoard - halfCorner;
                    y = halfBoard - halfCorner;
                } else if (spaceNumber === 20) {
                    // FREE PARKING corner (top-left in CSS, which is -X, +Y in Three.js)
                    x = -(halfBoard - halfCorner);
                    y = halfBoard - halfCorner;
                } else if (spaceNumber === 30) {
                    // GO TO JAIL corner (bottom-left in CSS, which is -X, -Y in Three.js)
                    x = -(halfBoard - halfCorner);
                    y = -(halfBoard - halfCorner);
                } else if (spaceNumber >= 1 && spaceNumber <= 9) {
                    // Bottom row (right to left in CSS)
                    const index = spaceNumber - 1;
                    x = halfBoard - cornerSize - (index + 0.5) * sliverLength;
                    y = -(halfBoard - halfCorner);
                } else if (spaceNumber >= 11 && spaceNumber <= 19) {
                    // Left side (bottom to top in CSS)
                    const index = spaceNumber - 11;
                    x = -(halfBoard - halfCorner);
                    y = -(halfBoard - cornerSize) + (index + 0.5) * sliverLength;
                } else if (spaceNumber >= 21 && spaceNumber <= 29) {
                    // Top row (left to right in CSS)
                    const index = spaceNumber - 21;
                    x = -(halfBoard - cornerSize) + (index + 0.5) * sliverLength;
                    y = halfBoard - halfCorner;
                } else if (spaceNumber >= 31 && spaceNumber <= 39) {
                    // Right side (top to bottom in CSS)
                    const index = spaceNumber - 31;
                    x = halfBoard - halfCorner;
                    y = halfBoard - cornerSize - (index + 0.5) * sliverLength;
                }

                return new Vector3(x, y, spaceZ);
            }

            // Function to sync Three.js camera with CSS board rotation
            function syncCameraRotation() {
                // Convert CSS rotation to Three.js camera rotation
                const radX = (threeRotationX * Math.PI) / 180;
                const radZ = (threeRotationZ * Math.PI) / 180;

                // Calculate camera position based on rotation
                // Match the CSS perspective: rotateX(60deg) rotateZ(-45deg)
                const distance = 1200;
                const x = Math.sin(radZ) * distance * Math.cos(radX);
                const y = Math.sin(radX) * distance;
                const z = Math.cos(radZ) * distance * Math.cos(radX);

                camera.position.set(x, y, z);
                camera.lookAt(0, 0, 0);
                camera.updateProjectionMatrix();
            }

            // Initial camera sync
            syncCameraRotation();

            // Expose sync function globally
            window.syncThreeJSCamera = function(rotX, rotZ) {
                threeRotationX = rotX;
                threeRotationZ = rotZ;
                syncCameraRotation();
            };

            // Animation loop
            function animate() {
                requestAnimationFrame(animate);
                renderer.render(scene, camera);
            }
            animate();

            // Function to get 3D position from actual DOM element
            function getSpacePositionFromDOM(spaceNumber) {
                const spacesContainer = document.querySelector('.board-spaces');
                const space = spacesContainer ? spacesContainer.querySelector(`[data-space="${spaceNumber}"]`) : null;
                if (!space) {
                    console.warn(`Space ${spaceNumber} not found in DOM, using calculated position`);
                    return getSpace3DPosition(spaceNumber);
                }
                
                // Get the bounding box of the space element
                const rect = space.getBoundingClientRect();
                const boardElement = document.querySelector('.board-3d');
                const boardRect = boardElement.getBoundingClientRect();
                
                // Calculate position relative to board center
                const boardCenterX = boardRect.left + boardRect.width / 2;
                const boardCenterY = boardRect.top + boardRect.height / 2;
                
                // Space center relative to board center (in pixels)
                const spaceCenterX = rect.left + rect.width / 2 - boardCenterX;
                const spaceCenterY = rect.top + rect.height / 2 - boardCenterY;
                
                // Convert to Three.js coordinates
                // CSS: X increases right, Y increases down
                // Three.js: X increases right, Y increases up, Z increases toward camera
                const x = spaceCenterX;
                const y = -spaceCenterY; // Flip Y axis
                const z = 20; // Tiles are elevated
                
                console.log(`DOM position for space ${spaceNumber}:`, { spaceCenterX, spaceCenterY, x, y, z });
                return new Vector3(x, y, z);
            }

            // Function to load and place a model on a board space
            window.loadModelOnBoard = async function(modelPath, spaceNumber, scale = 1) {
                const loader = new GLTFLoader();
                loader.load(
                    modelPath,
                    async (gltf) => {
                        const model = gltf.scene;
                        // Try to get position from DOM first, fallback to calculated
                        const position = getSpacePositionFromDOM(spaceNumber);
                        model.position.copy(position);
                        model.scale.set(scale, scale, scale);
                        
                        // Center the model's pivot point
                        model.traverse((child) => {
                            if (child.isMesh) {
                                child.geometry.center();
                            }
                        });
                        
                        scene.add(model);
                        console.log(`Model loaded on space ${spaceNumber} at position:`, position);
                        console.log(`Camera position:`, camera.position);
                        
                        // Add a debug helper sphere to verify position
                        const helperGeometry = new SphereGeometry(15, 16, 16);
                        const helperMaterial = new MeshBasicMaterial({ color: 0xff0000, wireframe: true });
                        const helper = new Mesh(helperGeometry, helperMaterial);
                        helper.position.copy(position);
                        helper.position.z += 30; // Slightly above the tile
                        scene.add(helper);
                        console.log(`Debug sphere added at:`, helper.position);
                    },
                    undefined,
                    (error) => {
                        console.error('Error loading model:', error);
                    }
                );
            };

            // Handle window resize
            window.addEventListener('resize', () => {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            });

            console.log('Three.js initialized for board models!');
            console.log('Use loadModelOnBoard(modelPath, spaceNumber, scale) to place models');

            // Spawn a test model on GO square (space 0)
            setTimeout(() => {
                loadModelOnBoard('Models/Shoe/shoe.glb', 0, 1.0);
            }, 500);
        } catch (error) {
            console.error('Failed to initialize Three.js:', error);
        }
    }

    // Initialize Three.js after a short delay to ensure DOM is ready
    setTimeout(initThreeJS, 100);
});





