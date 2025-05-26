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
        
        // Add collision for all cubes including pillars AND CEILING
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
                
                // Create collision box for this cube (INCLUDING CEILING)
                this.collisionBoxes.push({
                    minX: posX - scaleX/2,
                    maxX: posX + scaleX/2,
                    minY: posY - scaleY/2,
                    maxY: posY + scaleY/2,
                    minZ: posZ - scaleZ/2,
                    maxZ: posZ + scaleZ/2,
                    type: cube.type || 'unknown' // Keep track of cube type for debugging
                });
                
                // Debug logging for ceiling cubes
                if (cube.type === 'ceiling') {
                    // console.log(`Added ceiling collision at Y: ${posY}, bounds: ${posY - scaleY/2} to ${posY + scaleY/2}`);
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

        // Add invisible railings around the balcony edge
        const balconyWidth = 1.5;
        const balconyThickness = 0.4;
        const balconyHeight = 2.0;
        const y = 0;

        // North edge (along z)
        this.collisionBoxes.push({
            minX: -balconyWidth,
            maxX: this.poolRoom.mapSize + balconyWidth,
            minY: y,
            maxY: y + balconyHeight,
            minZ: -balconyWidth - balconyThickness,
            maxZ: -balconyWidth
        });
        // South edge
        this.collisionBoxes.push({
            minX: -balconyWidth,
            maxX: this.poolRoom.mapSize + balconyWidth,
            minY: y,
            maxY: y + balconyHeight,
            minZ: this.poolRoom.mapSize + balconyWidth,
            maxZ: this.poolRoom.mapSize + balconyWidth + balconyThickness
        });
        // West edge (along x)
        this.collisionBoxes.push({
            minX: -balconyWidth - balconyThickness,
            maxX: -balconyWidth,
            minY: y,
            maxY: y + balconyHeight,
            minZ: -balconyWidth,
            maxZ: this.poolRoom.mapSize + balconyWidth
        });
        // East edge
        this.collisionBoxes.push({
            minX: this.poolRoom.mapSize + balconyWidth,
            maxX: this.poolRoom.mapSize + balconyWidth + balconyThickness,
            minY: y,
            maxY: y + balconyHeight,
            minZ: -balconyWidth,
            maxZ: this.poolRoom.mapSize + balconyWidth
        });

        console.log(`Initialized ${this.collisionBoxes.length} collision boxes`);
        
        // Count ceiling collision boxes for debugging
        const ceilingBoxes = this.collisionBoxes.filter(box => box.type === 'ceiling');
        console.log(`Added ${ceilingBoxes.length} ceiling collision boxes`);
    }
    
    // Check collision with walls - returns adjusted position
    checkCollision(position, previousPosition, radius = 0.15) { 
        if (!this.enabled) return position;
        
        // Create a copy of the position to modify
        let newPosition = [position[0], position[1], position[2]];
        
        // Check pool wall collisions first
        for (const wall of this.poolWalls) {
            if (this.isWindowOpening(newPosition, wall)) continue;

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
        if (this.isPositionAbovePool(newPosition[0], newPosition[2]) && newPosition[1] < -1.1) {
            console.log('Emergency fix: Found player below pool floor, teleporting up');
            newPosition[1] = -0.7;
            
            if (window.camera && window.camera.velocity) {
                window.camera.velocity.elements[1] = 0;
            }
            
            return newPosition;
        }
        
        // Allow walking onto the balcony by expanding the world bounds
        const balconyExtension = 2.0;
    
        const isOutsideWorld = (
            newPosition[0] < -balconyExtension ||
            newPosition[0] > this.poolRoom.mapSize - 1 + balconyExtension ||
            newPosition[2] < -balconyExtension ||
            newPosition[2] > this.poolRoom.mapSize - 1 + balconyExtension
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
            const poolBottom = -1.0;
            if (newPosition[1] < poolBottom + effectiveRadius) {
                console.log("Correcting position to pool bottom");
                newPosition[1] = poolBottom + effectiveRadius;
            } else {
                newPosition[1] = previousPosition[1];
            }
        }
    
        // Super safety check
        if (this.isPositionAbovePool(newPosition[0], newPosition[2]) && newPosition[1] < -1.5) {
            console.log('Emergency prevention: Teleporting from below pool');
            newPosition[1] = -0.8;
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

    isWindowOpening(position, wall) {
        const [x, y, z] = position;
        // Example: north wall window
        if (wall.minZ === 0) {
            if (x > 10 && x < 22 && y > 0.5 && y < 2.5 && Math.abs(z - wall.minZ) < 0.2) {
                return true;
            }
        }
        // Add more checks for other windows as needed
        return false;
    }

    // Also add this helper method to better detect ceiling collisions:
    isCollidingWithCeiling(position, radius) {
        const testY = position[1] + radius; // Top of player
        
        for (const box of this.collisionBoxes) {
            if (box.type === 'ceiling') {
                // Check if player's head would hit this ceiling box
                if (position[0] + radius > box.minX &&
                    position[0] - radius < box.maxX &&
                    testY >= box.minY && // Player's head is at or below ceiling top
                    position[1] - radius < box.maxY && // Player's feet are above ceiling bottom (ensures overlap)
                    position[2] + radius > box.minZ &&
                    position[2] - radius < box.maxZ) {
                    
                    console.log(`Ceiling collision detected by isCollidingWithCeiling at Y: ${testY}, ceiling bounds: ${box.minY} to ${box.maxY}`);
                    return true;
                }
            }
        }
        return false;
    }
}

function addCeilingCollisions() {
    // ... existing code ...
    
    // Add a check to prevent duplicate ceiling collisions
    const existingCeilings = new Set();
    
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
        for (let z = bounds.minZ; z <= bounds.maxZ; z++) {
            const key = `${ceilingY}-${x}-${z}`;
            if (!existingCeilings.has(key)) {
                existingCeilings.add(key);
                const box = new CollisionBox(x, ceilingY, z, x + 1, ceilingY + 0.1, z + 1, 'ceiling');
                collisionBoxes.push(box);
                // Remove or comment out this console.log to stop spam
                // console.log(`Added ceiling collision at Y: ${ceilingY}, bounds: ${x} to ${x + 1}`);
            }
        }
    }
}