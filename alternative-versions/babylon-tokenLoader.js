// Token GLB Loading Module with Babylon.js

const BabylonTokenLoader = {
    tokens: {
        'tophat': './Models/TopHat/tophat.glb',
        'shoe': './Models/Shoe/shoe.glb',
        'cheeseburger': './Models/Cheeseburger/cheeseburger.glb',
        'helicopter': './Models/Helicopter/helicopter.glb',
        'football': './Models/Football/football.glb',
        'rollsroyce': './Models/RollsRoyce/rollsRoyceCarAnim.glb'
    },

    tokenModels: {},
    loadedCount: 0,
    scene: null,

    async init(scene) {
        this.scene = scene;
    },

    async loadAllTokens() {
        const promises = [];
        for (const [tokenName, modelPath] of Object.entries(this.tokens)) {
            promises.push(this.loadToken(tokenName, modelPath));
        }
        await Promise.all(promises);
        console.log('All tokens loaded:', Object.keys(this.tokenModels));
    },

    async loadToken(tokenName, modelPath) {
        return new Promise((resolve) => {
            BABYLON.SceneLoader.ImportMesh(
                '',
                modelPath.substring(0, modelPath.lastIndexOf('/') + 1),
                modelPath.substring(modelPath.lastIndexOf('/') + 1),
                this.scene,
                (meshes, particleSystems, skeletons) => {
                    // Create a parent to hold all loaded meshes
                    const parent = new BABYLON.TransformNode('token_' + tokenName, this.scene);
                    meshes.forEach(mesh => {
                        mesh.parent = parent;
                        mesh.isPickable = true;
                    });
                    parent.setEnabled(false); // Hide until cloned
                    this.tokenModels[tokenName] = {
                        meshes: meshes,
                        parent: parent,
                        skeletons: skeletons
                    };
                    this.loadedCount++;
                    console.log(`Loaded token: ${tokenName}`);
                    resolve(this.tokenModels[tokenName]);
                },
                undefined,
                (scene, message, exception) => {
                    console.error(`Failed to load token ${tokenName}:`, message, exception);
                    resolve(null);
                }
            );
        });
    },

    getToken(tokenName) {
        return this.tokenModels[tokenName] || null;
    },

    cloneToken(tokenName, scene) {
        const token = this.getToken(tokenName);
        if (token && token.parent) {
            const clonedParent = token.parent.clone('token_clone_' + Date.now());
            clonedParent.setEnabled(true);
            return clonedParent;
        }
        return null;
    },

    getAllTokenNames() {
        return Object.keys(this.tokens);
    }
};

// Export to window
window.BabylonTokenLoader = BabylonTokenLoader;
