// ====== LOBBY HELICOPTER ANIMATION ======
// Single helicopter model flying across the lobby

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚁 Initializing helicopter animation...');
    
    // Initialize Three.js for helicopter
    async function initHelicopterAnimation() {
        try {
            const { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, BoxGeometry, MeshBasicMaterial, Mesh, Vector3, ArrowHelper, PCFSoftShadowMap, Clock, AnimationMixer } = await import('three');
            const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
            
            // Create Three.js container
            const container = document.createElement('div');
            container.id = 'helicopter-background';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
                pointer-events: none;
            `;
            document.body.appendChild(container);
            
            let scene, camera, renderer, helicopter, mixer;
            const clock = new Clock();
            let flightMode = Math.floor(Math.random() * 5); // 0‑4 different flight patterns
            let animationStartTime = Date.now();
            
            // Create directional arrows to show orientation
            function createDirectionArrows(scene) {
                const arrowLength = 5;
                
                // North arrow (positive Z) - Yellow
                const northArrow = new ArrowHelper(new Vector3(0, 0, 1), new Vector3(0, 0, 0), arrowLength, 0xffff00);
                scene.add(northArrow);
                
                // South arrow (negative Z) - Red
                const southArrow = new ArrowHelper(new Vector3(0, 0, -1), new Vector3(0, 0, 0), arrowLength, 0xff0000);
                scene.add(southArrow);
                
                // East arrow (positive X) - Green
                const eastArrow = new ArrowHelper(new Vector3(1, 0, 0), new Vector3(0, 0, 0), arrowLength, 0x00ff00);
                scene.add(eastArrow);
                
                // West arrow (negative X) - Blue
                const westArrow = new ArrowHelper(new Vector3(-1, 0, 0), new Vector3(0, 0, 0), arrowLength, 0x0000ff);
                scene.add(westArrow);
                
                console.log('🧭 Direction arrows: Yellow=North, Red=South, Green=East, Blue=West');
            }
            
            // Initialize Three.js
            function initThreeJS() {
                // Scene setup
                scene = new Scene();
                scene.background = null; // Transparent background
                
                // Camera setup
                camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                camera.position.set(0, 5, 25);
                camera.lookAt(0, 5, 0);
                
                // Renderer setup
                renderer = new WebGLRenderer({ alpha: true, antialias: true });
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = PCFSoftShadowMap;
                container.appendChild(renderer.domElement);
                
                // Lighting
                const ambientLight = new AmbientLight(0xffffff, 0.6);
                scene.add(ambientLight);
                
                const directionalLight = new DirectionalLight(0xffffff, 0.8);
                directionalLight.position.set(5, 10, 5);
                directionalLight.castShadow = true;
                scene.add(directionalLight);
                
                // Compass arrows (debug) disabled for production
                // createDirectionArrows(scene);
                
                // Load helicopter
                loadHelicopter();
                
                // Start render loop
                render();
                
                // Handle window resize
                window.addEventListener('resize', onWindowResize, false);
            }
            
            function loadHelicopter() {
                const loader = new GLTFLoader();
                loader.load(
                    'Models/Helicopter/helicopter.glb',
                    (gltf) => {
                        helicopter = gltf.scene;
                        
                        // Start position - far south, flying north toward camera (slightly lower)
                        helicopter.position.set(-10, 7, -60);
                        helicopter.scale.set(0.15, 0.15, 0.15);
                        helicopter.rotation.set(0, -Math.PI / 2, 0); // Face north (+Z, yellow)

                        // Play all GLTF animations so main and tail rotors both run
                        if (gltf.animations && gltf.animations.length > 0) {
                            mixer = new AnimationMixer(helicopter);
                            gltf.animations.forEach((clip, index) => {
                                const action = mixer.clipAction(clip);
                                
                                // Try to detect main/tail rotor clips by name or index and speed them up a lot
                                const name = (clip.name || '').toLowerCase();
                                if (name.includes('main') || name.includes('rotor') || name.includes('tail') || index === 0 || index === 1) {
                                    action.timeScale = 4.0; // Very fast spin so loop is almost invisible
                                    action.startAt(Math.random() * clip.duration); // desync start so restart is hidden
                                } else {
                                    action.timeScale = 1.0;
                                }
                                
                                action.play();
                            });
                            console.log(`🚁 Playing ${gltf.animations.length} helicopter animation clips`);
                        } else {
                            console.warn('🚁 Helicopter model has no animations; using fallback rotor spin only');
                        }
                        
                        scene.add(helicopter);
                        console.log('🚁 Helicopter model loaded!');
                        
                        // Start animation
                        animateHelicopter();
                    },
                    (progress) => {
                        console.log(`Loading helicopter: ${(progress.loaded / progress.total * 100)}%`);
                    },
                    (error) => {
                        console.error('Error loading helicopter model:', error);
                        // Create fallback helicopter
                        createFallbackHelicopter(scene);
                    }
                );
            }
            
            // Create fallback helicopter if model fails
            function createFallbackHelicopter(scene) {
                const geometry = new BoxGeometry(2, 0.8, 2);
                const material = new MeshBasicMaterial({ 
                    color: 0xff0000,
                    wireframe: false
                });
                helicopter = new Mesh(geometry, material);
                
                helicopter.position.set(-5, 10, -50);
                helicopter.scale.set(0.15, 0.15, 0.15); // EVEN smaller
                helicopter.rotation.set(0, -Math.PI / 2, 0); // Face YELLOW arrow (North, +Z)
                scene.add(helicopter);
                
                // Add rotor blades
                const rotorGeometry = new BoxGeometry(6, 0.1, 0.4);
                const rotorMaterial = new MeshBasicMaterial({ color: 0x333333 });
                const rotor = new Mesh(rotorGeometry, rotorMaterial);
                rotor.position.set(0, 0.8, 0);
                helicopter.add(rotor);
                
                console.log('🚁 Fallback helicopter created');
                animateHelicopter();
            }
            
            // Animate helicopter flight
            function animateHelicopter() {
                function animate() {
                    if (!helicopter) return;
                    
                    const elapsed = (Date.now() - animationStartTime) / 1000; // seconds
                    const visibleDuration = 14;    // time actually flying across the screen
                    const totalDuration = 20;      // includes ~6s fully off-screen at the end
                    
                    const t = Math.min(elapsed / visibleDuration, 1);
                    const exitT = elapsed <= visibleDuration ? 0 : Math.min((elapsed - visibleDuration) / (totalDuration - visibleDuration), 1);
                    let x, y, z, rotY, bankZ;
                    let exitVX = 0, exitVZ = 0;

                    if (flightMode === 0) {
                        // Mode 0: Left‑to‑right flyby, goes VERY far past edges
                        x = -140 + t * 260;           // -140 → 120
                        z = -25;
                        y = 7 + Math.sin(t * Math.PI) * 1.5;
                        rotY = 0;                     // east
                        bankZ = -0.15 * Math.sin(t * Math.PI);
                        exitVX = 1; exitVZ = 0;
                    } else if (flightMode === 1) {
                        // Mode 1: Right‑to‑left flyby, goes VERY far past edges
                        x = 140 - t * 260;            // 140 → -120
                        z = -22;
                        y = 6.5 + Math.sin(t * Math.PI) * 1.2;
                        rotY = Math.PI;               // west
                        bankZ = 0.15 * Math.sin(t * Math.PI);
                        exitVX = -1; exitVZ = 0;
                    } else if (flightMode === 2) {
                        // Mode 2: Diagonal north‑east pass, then very far off to the right
                        x = -140 + t * 260;           // -140 → 120
                        z = -40 + t * 5;              // -40 → -35
                        y = 6 + t * 2 + Math.sin(t * Math.PI) * 0.7;
                        rotY = -Math.PI / 4;          // facing north‑east
                        bankZ = -0.18 * Math.sin(t * Math.PI);
                        exitVX = 1; exitVZ = 0.25;
                    } else if (flightMode === 3) {
                        // Mode 3: Large arc circling behind the city, exits very far to the right
                        const angle = -Math.PI * 0.9 + t * Math.PI * 0.95;
                        const radius = 90;
                        const centerX = 10;
                        const centerZ = -35;

                        x = centerX + Math.cos(angle) * radius;
                        z = centerZ + Math.sin(angle) * radius;
                        y = 7 + Math.sin(t * Math.PI) * 1.0;

                        rotY = Math.atan2(
                            centerZ + Math.sin(angle + 0.01) * radius - z,
                            centerX + Math.cos(angle + 0.01) * radius - x
                        );
                        bankZ = -0.2 * Math.sin(t * Math.PI);
                        // Continue the exit in the direction it was traveling at the end
                        exitVX = Math.cos(angle + Math.PI / 2);
                        exitVZ = Math.sin(angle + Math.PI / 2);
                    } else {
                        // Mode 4: Fast fly‑by, reverse, then dive south (red arrow) and exit
                        // Use three segments blended over t to keep it smooth.
                        if (t < 0.4) {
                            // Segment 1: very fast left‑to‑right across screen (WAY off left to WAY off right)
                            const p = t / 0.4;
                            x = -160 + p * 320;       // -160 → 160
                            z = -20;
                            y = 7 + Math.sin(p * Math.PI) * 1.2;
                            rotY = 0;                 // east
                            bankZ = -0.22 * Math.sin(p * Math.PI);
                            exitVX = 1; exitVZ = 0;
                        } else if (t < 0.7) {
                            // Segment 2: swing back to the left (way off right back toward far left)
                            const p = (t - 0.4) / 0.3;
                            x = 160 - p * 280;        // 160 → -120
                            z = -22;
                            y = 7.5 + Math.sin(p * Math.PI) * 0.8;
                            rotY = Math.PI;           // west
                            bankZ = 0.22 * Math.sin(p * Math.PI);
                            exitVX = -1; exitVZ = 0;
                        } else {
                            // Segment 3: turn south and dive away (toward red arrow, -Z), way off‑screen
                            const p = (t - 0.7) / 0.3;
                            x = -120 + p * 20;        // -120 → -100
                            z = -22 - p * 80;         // -22 → -102 (far south)
                            y = 7.5 + p * 3;          // 7.5 → 10.5
                            rotY = Math.PI / 2;       // south / red arrow (‑Z)
                            bankZ = -0.25 * Math.sin(p * Math.PI);
                            exitVX = 0; exitVZ = -1;
                        }
                    }

                    // During the "buffer" time, keep flying further away so it never freezes near the edge.
                    if (exitT > 0) {
                        const exitDistance = 220; // push way beyond screen while buffering
                        x += exitVX * exitT * exitDistance;
                        z += exitVZ * exitT * exitDistance;
                    }

                    helicopter.position.set(x, y, z);
                    helicopter.rotation.set(0, rotY, bankZ);

                    // After totalDuration (includes off‑screen hold at the end), pick a new mode
                    if (elapsed >= totalDuration) {
                        animationStartTime = Date.now();
                        flightMode = Math.floor(Math.random() * 5);
                    }
                    
                    requestAnimationFrame(animate);
                }
                animate();
            }
            
            // Render loop
            function render() {
                requestAnimationFrame(render);
                
                // Update any GLTF animations (main + tail rotor, etc.)
                if (mixer) {
                    const delta = clock.getDelta();
                    mixer.update(delta);
                }
                
                renderer.render(scene, camera);
            }
            
            // Handle window resize
            function onWindowResize() {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
            
            // Start everything
            initThreeJS();
            
            console.log('🚁 Helicopter animation system initialized!');
            
        } catch (error) {
            console.error('Failed to initialize helicopter animation:', error);
        }
    }
    
    // Initialize helicopter animation after DOM is ready
    initHelicopterAnimation();
    
    console.log('🚁 Lobby helicopter animation ready!');
});