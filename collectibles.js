// collectibles.js - OBJ collectible system
import { Model } from './objLoader.js';

export class CollectibleSystem {
    constructor(gl, poolRoom) {
        this.gl = gl;
        this.poolRoom = poolRoom;
        this.collectibles = [];
        this.collectedCount = 0;
        this.totalCount = 0;
        
        // Collectible properties
        this.collectibleDistance = 2.0; // How close player needs to be
        this.rotationSpeed = 1.0; // How fast they rotate
        this.bobSpeed = 2.0; // How fast they bob up and down
        this.bobHeight = 0.3; // How much they bob
        this.time = 0;
        
        // Create collectibles
        this.createCollectibles();
        
        // Create UI
        this.createUI();
    }
    
    // Create collectible OBJ models placed around the world
    createCollectibles() {
        const collectibleData = [
            // Format: [x, y, z, modelPath, scale, color]
            [8, 1.5, 8, 'models/teapot.obj', 0.3, [0.8, 0.2, 0.2]], // Red teapot
            [24, 1.5, 8, 'models/bunny.obj', 0.5, [0.2, 0.8, 0.2]], // Green bunny
            [8, 1.5, 24, 'models/dragon.obj', 0.4, [0.2, 0.2, 0.8]], // Blue dragon
            [24, 1.5, 24, 'models/cube.obj', 0.6, [0.8, 0.8, 0.2]], // Yellow cube
            [16, 1.5, 6, 'models/sphere.obj', 0.4, [0.8, 0.2, 0.8]], // Purple sphere
            [16, 1.5, 26, 'models/cow.obj', 0.5, [0.2, 0.8, 0.8]], // Cyan cow
        ];
        
        collectibleData.forEach((data, index) => {
            const [x, y, z, modelPath, scale, color] = data;
            
            const collectible = {
                id: index,
                model: new Model(this.gl, modelPath),
                position: [x, y, z],
                baseY: y, // For bobbing animation
                scale: scale,
                color: color,
                collected: false,
                rotationY: 0,
                glowIntensity: 1.0
            };
            
            // Set initial transform
            collectible.model.setPosition(x, y, z);
            collectible.model.setScale(scale, scale, scale);
            collectible.model.setColor(...color, 1.0);
            
            this.collectibles.push(collectible);
            this.totalCount++;
        });
        
        console.log(`Created ${this.totalCount} collectibles`);
    }
    
    // Update collectibles animation and check for collection
    update(deltaTime, playerPosition) {
        this.time += deltaTime;
        
        this.collectibles.forEach(collectible => {
            if (collectible.collected) return;
            
            // Rotation animation
            collectible.rotationY += this.rotationSpeed * deltaTime;
            
            // Bobbing animation
            const bobOffset = Math.sin(this.time * this.bobSpeed + collectible.id) * this.bobHeight;
            collectible.position[1] = collectible.baseY + bobOffset;
            
            // Glowing effect
            collectible.glowIntensity = 0.8 + 0.2 * Math.sin(this.time * 3 + collectible.id);
            
            // Update model transform
            collectible.model.modelMatrix.setIdentity();
            collectible.model.modelMatrix.setTranslate(
                collectible.position[0],
                collectible.position[1],
                collectible.position[2]
            );
            collectible.model.modelMatrix.rotate(collectible.rotationY * 180 / Math.PI, 0, 1, 0);
            collectible.model.modelMatrix.scale(collectible.scale, collectible.scale, collectible.scale);
            
            // Check for collection
            this.checkCollection(collectible, playerPosition);
        });
    }
    
    // Check if player is close enough to collect
    checkCollection(collectible, playerPosition) {
        const dx = playerPosition[0] - collectible.position[0];
        const dy = playerPosition[1] - collectible.position[1];
        const dz = playerPosition[2] - collectible.position[2];
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (distance < this.collectibleDistance) {
            this.collectItem(collectible);
        }
    }
    
    // Collect an item
    collectItem(collectible) {
        if (collectible.collected) return;
        
        collectible.collected = true;
        this.collectedCount++;
        
        console.log(`Collected item ${collectible.id + 1}! (${this.collectedCount}/${this.totalCount})`);
        
        // Play collection effect (simple console log for now)
        this.showCollectionEffect(collectible);
        
        // Update UI
        this.updateUI();
        
        // Check if all collected
        if (this.collectedCount === this.totalCount) {
            this.onAllCollected();
        }
    }
    
    // Show collection effect
    showCollectionEffect(collectible) {
        // Create temporary visual effect
        const effectDiv = document.createElement('div');
        effectDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
        `;
        effectDiv.textContent = `✨ Collected! (${this.collectedCount}/${this.totalCount}) ✨`;
        
        document.body.appendChild(effectDiv);
        
        // Remove after 2 seconds
        setTimeout(() => {
            document.body.removeChild(effectDiv);
        }, 2000);
    }
    
    // Called when all items are collected
    onAllCollected() {
        const congratsDiv = document.createElement('div');
        congratsDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 215, 0, 0.95);
            color: black;
            padding: 30px;
            border-radius: 15px;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            z-index: 1001;
            border: 3px solid gold;
        `;
        congratsDiv.innerHTML = `
            🎉 CONGRATULATIONS! 🎉<br>
            You collected all ${this.totalCount} items!<br>
            <small style="font-size: 18px;">Assignment 4 Complete!</small>
        `;
        
        document.body.appendChild(congratsDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            document.body.removeChild(congratsDiv);
        }, 5000);
        
        console.log('🎉 All collectibles found! Assignment 4 requirements fulfilled!');
    }
    
    // Create UI counter
    createUI() {
        const counterDiv = document.createElement('div');
        counterDiv.id = 'collectible-counter';
        counterDiv.style.cssText = `
            position: absolute;
            top: 10px;
            right: 150px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 18px;
            font-weight: bold;
            z-index: 100;
        `;
        
        document.body.appendChild(counterDiv);
        this.updateUI();
    }
    
    // Update UI counter
    updateUI() {
        const counterDiv = document.getElementById('collectible-counter');
        if (counterDiv) {
            counterDiv.innerHTML = `
                📦 Collectibles: ${this.collectedCount}/${this.totalCount}<br>
                <small>Get close to collect!</small>
            `;
        }
    }
    
    // Render all uncollected collectibles
    render(gl, program, camera, lightingSystem) {
        this.collectibles.forEach(collectible => {
            if (collectible.collected) return;
            
            // Enhanced glow effect for collectibles
            const u_baseColor = gl.getUniformLocation(program, 'u_baseColor');
            gl.uniform4f(u_baseColor, 
                collectible.color[0] * collectible.glowIntensity,
                collectible.color[1] * collectible.glowIntensity,
                collectible.color[2] * collectible.glowIntensity,
                1.0
            );
            
            // Render the model
            collectible.model.render(gl, program, camera.viewMatrix, camera.projectionMatrix, lightingSystem);
        });
    }
    
    // Get nearest collectible info (for hint system)
    getNearestCollectible(playerPosition) {
        let nearestDistance = Infinity;
        let nearestCollectible = null;
        
        this.collectibles.forEach(collectible => {
            if (collectible.collected) return;
            
            const dx = playerPosition[0] - collectible.position[0];
            const dy = playerPosition[1] - collectible.position[1];
            const dz = playerPosition[2] - collectible.position[2];
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestCollectible = collectible;
            }
        });
        
        return { collectible: nearestCollectible, distance: nearestDistance };
    }
}