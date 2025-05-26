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
        this.bobHeight = 0.1; // Reduced from 0.3 to 0.1 for smaller models
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
            [8, 1.5, 8, 'models/benchy.obj', 0.1, [0.8, 0.2, 0.2]], // Red benchy - increased from 0.05
            [24, 1.5, 8, 'models/bunny.obj', 0.08, [0.2, 0.8, 0.2]], // Green bunny - good size
            [8, 1.5, 24, 'models/dragon.obj', 0.06, [0.2, 0.2, 0.8]], // Blue dragon - good size
            [24, 1.5, 24, 'models/head.obj', 0.03, [0.8, 0.8, 0.2]], // Yellow head - reduced from 0.1 to 0.03
            [16, 1.5, 6, 'models/teapot.obj', 0.07, [0.8, 0.2, 0.8]], // Purple teapot - good size
            [16, 1.5, 26, 'models/trumpet.obj', 0.03, [0.2, 0.8, 0.8]], // Cyan trumpet - reduced from 0.08 to 0.03
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
            
            // Set initial transform with the smaller scale
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
            
            // Skip if model isn't loaded yet or modelMatrix isn't ready
            if (!collectible.model || !collectible.model.modelMatrix) {
                return;
            }
            
            // Rotation animation
            collectible.rotationY += this.rotationSpeed * deltaTime;
            
            // Bobbing animation
            const bobOffset = Math.sin(this.time * this.bobSpeed + collectible.id) * this.bobHeight;
            // Update the y-position directly for translation
            const currentY = collectible.baseY + bobOffset;
            
            // Glowing effect
            collectible.glowIntensity = 0.8 + 0.2 * Math.sin(this.time * 3 + collectible.id);
            
            // Update model transform using Model's own methods for T * R * S transformation
            // 1. Model.setPosition() calls modelMatrix.setTranslate(), effectively setting M = T
            collectible.model.setPosition(
                collectible.position[0],
                currentY,
                collectible.position[2]
            );

            // 2. Model.setScale() calls modelMatrix.scale(), effectively M = M * S (so M = T * R * S)
            collectible.model.setScale(collectible.scale, collectible.scale, collectible.scale);
            
            // Check for collection
            // Note: checkCollection uses collectible.position, which doesn't include the bobOffset for its y.
            // For accurate distance checking, we should use the model's actual animated position.
            const animatedPosition = [
                collectible.position[0],
                currentY,
                collectible.position[2]
            ];
            this.checkCollection(collectible, playerPosition, animatedPosition);
        });
    }
    
    // Check if player is close enough to collect
    checkCollection(collectible, playerPosition, animatedCollectiblePosition) {
        const dx = playerPosition[0] - animatedCollectiblePosition[0];
        const dy = playerPosition[1] - animatedCollectiblePosition[1];
        const dz = playerPosition[2] - animatedCollectiblePosition[2];
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
        
        // Play collection effect
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
            if (document.body.contains(effectDiv)) {
                document.body.removeChild(effectDiv);
            }
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
            if (document.body.contains(congratsDiv)) {
                document.body.removeChild(congratsDiv);
            }
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
            
            // Skip if model isn't loaded yet
            if (!collectible.model || !collectible.model.modelMatrix || !collectible.model.vertexBuffer) {
                return;
            }
            
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
        let actualNearestY = 0; // Store the Y used for distance calculation
        
        this.collectibles.forEach(collectible => {
            if (collectible.collected) return;

            // Calculate current animated Y for distance check
            const bobOffset = Math.sin(this.time * this.bobSpeed + collectible.id) * this.bobHeight;
            const currentY = collectible.baseY + bobOffset;
            
            const dx = playerPosition[0] - collectible.position[0];
            const dy = playerPosition[1] - currentY;
            const dz = playerPosition[2] - collectible.position[2];
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestCollectible = collectible;
                actualNearestY = currentY; // Store this Y
            }
        });
        
        // Return the collectible and its distance, potentially with its animated position
        if (nearestCollectible) {
            return { 
                collectible: nearestCollectible, 
                distance: nearestDistance,
                animatedPosition: [nearestCollectible.position[0], actualNearestY, nearestCollectible.position[2]]
            };
        }
        return { collectible: null, distance: Infinity };
    }

    // Set rotation
    setRotation(angleX, angleY, angleZ) {
        // Store rotation values for use in updateModelMatrix
        this.rotation = [angleX, angleY, angleZ];
        this.updateModelMatrix();
    }

    setPosition(x, y, z) {
        this.position = [x, y, z];
        this.updateModelMatrix();
    }

    setScale(sx, sy, sz) {
        this.scale = [sx, sy, sz];
        this.updateModelMatrix();
    }

    updateModelMatrix() {
        // Rebuild the model matrix with proper TRS order
        this.modelMatrix.setIdentity();
        
        // Apply translation
        if (this.position) {
            this.modelMatrix.translate(this.position[0], this.position[1], this.position[2]);
        }
        
        // Apply rotations using available Matrix4 methods
        if (this.rotation) {
            // Try different rotation method names that might exist
            if (typeof this.modelMatrix.rotateX === 'function') {
                if (this.rotation[0] !== 0) this.modelMatrix.rotateX(this.rotation[0]);
                if (this.rotation[1] !== 0) this.modelMatrix.rotateY(this.rotation[1]);
                if (this.rotation[2] !== 0) this.modelMatrix.rotateZ(this.rotation[2]);
            } else if (typeof this.modelMatrix.setRotate === 'function') {
                // Some Matrix4 implementations use setRotate
                if (this.rotation[1] !== 0) {
                    const tempMatrix = new Matrix4();
                    tempMatrix.setRotate(this.rotation[1], 0, 1, 0);
                    this.modelMatrix.multiply(tempMatrix);
                }
            } else {
                // Fallback: manually create rotation matrix
                if (this.rotation[1] !== 0) {
                    const cos = Math.cos(this.rotation[1] * Math.PI / 180);
                    const sin = Math.sin(this.rotation[1] * Math.PI / 180);
                    const rotMatrix = new Matrix4();
                    rotMatrix.elements.set([
                        cos, 0, sin, 0,
                        0, 1, 0, 0,
                        -sin, 0, cos, 0,
                        0, 0, 0, 1
                    ]);
                    this.modelMatrix.multiply(rotMatrix);
                }
            }
        }
        
        // Apply scale
        if (this.scale) {
            this.modelMatrix.scale(this.scale[0], this.scale[1], this.scale[2]);
        }
    }
}