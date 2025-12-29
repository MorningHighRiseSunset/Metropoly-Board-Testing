// Token GLB Loading Module with Three.js

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const ThreeTokenLoader = {
    tokens: {
        'tophat': './Models/TopHat/tophat.glb',
        'shoe': './Models/Shoe/shoe.glb',
        'cheeseburger': './Models/Cheeseburger/cheeseburger.glb',
        'helicopter': './Models/Helicopter/helicopter.glb',
        'football': './Models/Football/football.glb',
        'rollsroyce': './Models/RollsRoyce/rollsRoyceCarAnim.glb'
    },

    gltfLoader: null,
    tokenModels: {},
    loadedCount: 0,

    async init() {
        this.gltfLoader = new GLTFLoader();
    },

    async loadAllTokens() {
        await this.init();
        const promises = [];
        for (const [tokenName, modelPath] of Object.entries(this.tokens)) {
            promises.push(this.loadToken(tokenName, modelPath));
        }
        await Promise.all(promises);
        console.log('All tokens loaded:', Object.keys(this.tokenModels));
    },

    async loadToken(tokenName, modelPath) {
        return new Promise((resolve) => {
            this.gltfLoader.load(
                modelPath,
                (gltf) => {
                    this.tokenModels[tokenName] = gltf;
                    this.loadedCount++;
                    console.log(`Loaded token: ${tokenName}`);
                    resolve(gltf);
                },
                undefined,
                (error) => {
                    console.error(`Failed to load token ${tokenName}:`, error);
                    resolve(null);
                }
            );
        });
    },

    getToken(tokenName) {
        return this.tokenModels[tokenName] || null;
    },

    cloneToken(tokenName) {
        const token = this.getToken(tokenName);
        if (token && token.scene) {
            return token.scene.clone();
        }
        return null;
    },

    getAllTokenNames() {
        return Object.keys(this.tokens);
    }
};

// Export to window
window.ThreeTokenLoader = ThreeTokenLoader;
