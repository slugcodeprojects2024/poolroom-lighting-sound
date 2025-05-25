// collision.js - Fixed collision detection with pillar support
// Fixed to work with the actual PoolRoom implementation

export class CollisionHandler {
    constructor(poolRoom) {
        this.poolRoom = poolRoom;
        this.collisionBoxes = [];
        this.waterAreas = [];
        this.enabled = true;
        
        // Add pool walls to collision objects
        this.poolWalls = [];
        if (poolRoom && poolRoom.poolWalls) {
            for (const wall of poolRoom.poolWalls) {
                if (wall.position && wall.scale) {  // Check if properties exist
                    const pos = wall.position.elements || wall.position;  // Handle both array and Vector3 cases
                    const scale = wall.scale.elements || wall.scale;
                    
                    this.poolWalls.push({
                        minX: pos[0] - scale[0]/2,
                        maxX: pos[0] + scale[0]/2,
                        minY: pos[1] - scale[1]/2,
                        maxY: pos[1] + scale[1]/2,
                        minZ: pos[2] - scale[2]/2,
                        maxZ: pos[2] + scale[2]/2
                    });
                }
            }
        }
        
        // Initialize collision objects if poolRoom is provided
        if (poolRoom) {
            this.initCollisionObjects();
        }
    }
    
    // Update collision objects when blocks are added/removed
    updateCollisionObjects() {
        if (this.poolRoom) {
            this.initCollisionObjects();
        }
    }
    
    // Toggle collision detection on/off
    toggleCollision() {
        this.enabled = !this.enabled;
        console.log(`Collision detection: ${this.enabled ? 'Enabled' : 'Disabled'}`);
        return this.enabled;
    }
    
    initCollisionObjects() {
        // Clear existing collision objects
        this.collisionBoxes = [];
        this.waterAreas = [];
        
        // Create collision boxes based on the map grid
        if (!this.poolRoom.map) {
            console.error('PoolRoom map not initialized');
            return;
        }
        
        // Add collision for all cubes including pillars
        if (this.poolRoom.cubes) {
            for (const cube of this.poolRoom.cubes) {
                // Get cube position and scale from its matrix
                const matrix = cube.modelMatrix.elements;
                const posX = matrix[12];
                const posY = matrix[13];
                const posZ = matrix[14];
                
                // For scale, we need to look at the diagonal elements
                const scaleX = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1] + matrix[2] * matrix[2]);
                const scaleY = Math.sqrt(matrix[4] * matrix[4] + matrix[5] * matrix[5] + matrix[6] * matrix[6]);
                const scaleZ = Math.sqrt(matrix[8] * matrix[8] + matrix[9] * matrix[9] + matrix[10] * matrix[10]);
                
                // Create collision box for this cube
                this.collisionBoxes.push({
                    minX: posX - scaleX/2,
                    maxX: posX + scaleX/2,
                    minY: posY - scaleY/2,
                    maxY: posY + scaleY/2,
                    minZ: posZ - scaleZ/2,
                    maxZ: posZ + scaleZ/2,
                    type: cube.type // Keep track of cube type for debugging
                });
            }
        }
        
        // Add invisible barriers for window openings
        for (let x = 0; x < this.poolRoom.mapSize; x++) {
            for (let z = 0; z < this.poolRoom.mapSize; z++) {
                const height = this.poolRoom.map[x][z];
                
                if (height === 0 && 
                    (x === 0 || x === this.poolRoom.mapSize - 1 || 
                     z === 0 || z === this.poolRoom.mapSize - 1)) {
                    
                    // Create a thin invisible barrier only at the actual opening
                    // Adjust the barrier position based on which wall it's on
                    let barrier = {
                        minY: 0,
                        maxY: 1.2, // Barrier height
                    };
                    
                    if (x === 0) {
                        // West wall - barrier pushed far outside
                        barrier.minX = -0.50; // Half a unit outside the room
                        barrier.maxX = -0.45; // Very thin barrier
                        barrier.minZ = z - 0.5;
                        barrier.maxZ = z + 0.5;
                    } else if (x === this.poolRoom.mapSize - 1) {
                        // East wall - barrier pushed far outside
                        barrier.minX = x + 0.95; // Almost a full unit beyond the edge
                        barrier.maxX = x + 1.0;  // Very thin barrier
                        barrier.minZ = z - 0.5;
                        barrier.maxZ = z + 0.5;
                    } else if (z === 0) {
                        // North wall - barrier pushed far outside
                        barrier.minX = x - 0.5;
                        barrier.maxX = x + 0.5;
                        barrier.minZ = -0.50; // Half a unit outside the room
                        barrier.maxZ = -0.45; // Very thin barrier
                    } else if (z === this.poolRoom.mapSize - 1) {
                        // South wall - barrier pushed far outside
                        barrier.minX = x - 0.5;
                        barrier.maxX = x + 0.5;
                        barrier.minZ = z + 0.95; // Almost a full unit beyond the edge
                        barrier.maxZ = z + 1.0;  // Very thin barrier
                    }
                    
                    this.collisionBoxes.push(barrier);
                }
            }
        }
        
        // Add pool water collision area
        // Pool is in the center, 70% of map size
        const poolSize = this.poolRoom.mapSize * 0.7;
        const poolStart = (this.poolRoom.mapSize - poolSize) / 2;
        
        // Update water area definition
        this.waterAreas.push({
            minX: poolStart,
            maxX: poolStart + poolSize,
            minY: -1.0, // Bottom of water volume
            maxY: -0.05, // Water surface level
            minZ: poolStart,
            maxZ: poolStart + poolSize
        });
        
        // Add a SOLID pool floor
        this.collisionBoxes.push({
            minX: poolStart - 0.5,  // Extend slightly beyond pool edges
            maxX: poolStart + poolSize + 0.5,
            minY: -1.2, // Bottom of collision volume
            maxY: -0.9, // Slightly below water surface
            minZ: poolStart - 0.5,
            maxZ: poolStart + poolSize + 0.5
        });

        // Add a thin "landing" layer at the pool bottom for better collision detection
        this.collisionBoxes.push({
            minX: poolStart,
            maxX: poolStart + poolSize,
            minY: -1.0, // Exact pool bottom
            maxY: -0.95, // Very thin layer
            minZ: poolStart,
            maxZ: poolStart + poolSize
        });

        // Additional safety layer far below
        this.collisionBoxes.push({
            minX: 0,  // Cover the entire map
            maxX: this.poolRoom.mapSize,
            minY: -20.0, // Very far below 
            maxY: -10.0, // Thick layer
            minZ: 0,  // Cover the entire map
            maxZ: this.poolRoom.mapSize
        });
    }
    
    // Check collision with walls - returns adjusted position
    checkCollision(position, previousPosition, radius = 0.15) { 
        if (!this.enabled) return position;
        
        // Create a copy of the position to modify
        let newPosition = [position[0], position[1], position[2]];
        
        // Check pool wall collisions first
        for (const wall of this.poolWalls) {
            if (newPosition[0] + radius > wall.minX && 
                newPosition[0] - radius < wall.maxX &&
                newPosition[1] + radius > wall.minY && 
                newPosition[1] - radius < wall.maxY &&
                newPosition[2] + radius > wall.minZ && 
                newPosition[2] - radius < wall.maxZ) {
                return previousPosition;
            }
        }
        
        // CRITICAL FIX: First check if we're below the pool bottom
        // If we're in the pool area and below -1.1, teleport immediately back up
        if (this.isPositionAbovePool(newPosition[0], newPosition[2]) && newPosition[1] < -1.1) {
            console.log('Emergency fix: Found player below pool floor, teleporting up');
            newPosition[1] = -0.7; // Place just below water surface
            
            // Reset velocity to prevent continued falling
            if (window.camera && window.camera.velocity) {
                window.camera.velocity.elements[1] = 0;
            }
            
            return newPosition;
        }
        
        // Continue with the rest of the collision checks
        // Special window edge check - prevent falling through window
        const isOutsideWorld = (
            newPosition[0] < -0.45 || 
            newPosition[0] > this.poolRoom.mapSize - 0.55 ||
            newPosition[2] < -0.45 || 
            newPosition[2] > this.poolRoom.mapSize - 0.55
        );
        
        if (isOutsideWorld) {
            console.log('Preventing falling outside world');
            return previousPosition;
        }
        
        // Detect if we're near a window edge
        const isNearEdge = (
            newPosition[0] < 1.0 || 
            newPosition[0] > this.poolRoom.mapSize - 2 ||
            newPosition[2] < 1.0 || 
            newPosition[2] > this.poolRoom.mapSize - 2
        );
        
        // Ultra small radius near edges to get right up against windows
        const effectiveRadius = isNearEdge ? 0.05 : radius;
        
        // Check each axis separately for sliding collision
        // Check X movement
        let testPos = [newPosition[0], newPosition[1], previousPosition[2]];
        if (this.isPositionColliding(testPos, effectiveRadius)) {
            newPosition[0] = previousPosition[0];
        }
        
        // Check Z movement
        testPos = [newPosition[0], newPosition[1], newPosition[2]];
        if (this.isPositionColliding(testPos, effectiveRadius)) {
            newPosition[2] = previousPosition[2];
        }
        
        // Check Y movement (for jumping/falling)
        testPos = [newPosition[0], newPosition[1], newPosition[2]];
        if (this.isPositionColliding(testPos, effectiveRadius)) {
            const poolBottom = -1.0; // Pool bottom Y-coordinate
            if (newPosition[1] < poolBottom + effectiveRadius) {
                console.log("Correcting position to pool bottom");
                newPosition[1] = poolBottom + effectiveRadius; // Stop at the pool bottom
            } else {
                newPosition[1] = previousPosition[1]; // Revert to previous position
            }
        }

        // Add this critical emergency prevention code after the collision checks
        // Super safety check - if somehow still falling through, teleport back up
        if (this.isPositionAbovePool(newPosition[0], newPosition[2]) && newPosition[1] < -1.5) {
            console.log('Emergency prevention: Teleporting from below pool');
            newPosition[1] = -0.8; // Just below water surface
            // Reset velocity
            if (window.camera && window.camera.velocity) {
                window.camera.velocity.elements[1] = 0;
            }
        }

        return newPosition;
    }
    
    // Check if a position collides with any collision box
    isPositionColliding(position, radius) {
        for (const box of this.collisionBoxes) {
            if (position[0] + radius > box.minX &&
                position[0] - radius < box.maxX &&
                position[1] + radius > box.minY &&
                position[1] - radius < box.maxY &&
                position[2] + radius > box.minZ &&
                position[2] - radius < box.maxZ) {
                return true; // Collision detected
            }
        }
        return false; // No collision
    }
    
    // Check if player is in water
    isInWater(position) {
        if (!this.enabled) return false;
        
        for (const water of this.waterAreas) {
            if (position[0] >= water.minX && position[0] <= water.maxX &&
                position[1] >= water.minY && position[1] <= water.maxY &&
                position[2] >= water.minZ && position[2] <= water.maxZ) {
                return true;
            }
        }
        
        return false;
    }
    
    // Get ground level at position (for gravity/floor detection)
    getGroundLevel(x, z) {
        // Check if position is over the pool
        for (const water of this.waterAreas) {
            if (x >= water.minX && x <= water.maxX &&
                z >= water.minZ && z <= water.maxZ) {
                return -1.0; // Return pool bottom level
            }
        }
        
        // Otherwise return floor level
        return 0.0;
    }
    
    // Check if position is above the pool area
    isPositionAbovePool(x, z) {
        for (const water of this.waterAreas) {
            if (x >= water.minX && x <= water.maxX &&
                z >= water.minZ && z <= water.maxZ) {
                return true;
            }
        }
        return false;
    }
}