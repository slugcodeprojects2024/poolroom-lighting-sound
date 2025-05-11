// collision.js - Simple collision detection for grid-based world
// Fixed to work with the actual PoolRoom implementation

class CollisionHandler {
    constructor(poolRoom) {
        this.poolRoom = poolRoom;
        this.collisionBoxes = [];
        this.waterAreas = [];
        this.enabled = true; // Collision detection starts enabled
        
        // Initialize collision objects if poolRoom is provided
        if (poolRoom) {
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
        
        for (let x = 0; x < this.poolRoom.mapSize; x++) {
            for (let z = 0; z < this.poolRoom.mapSize; z++) {
                const height = this.poolRoom.map[x][z];
                
                if (height > 0) {
                    // Create collision box for wall blocks
                    this.collisionBoxes.push({
                        minX: x - 0.5,
                        maxX: x + 0.5,
                        minY: 0,
                        maxY: height,
                        minZ: z - 0.5,
                        maxZ: z + 0.5
                    });
                }
                
                // NO invisible barriers for window openings - we'll handle this differently
                // Instead we'll use a boundary check in the checkCollision method
            }
        }
        
        // Add pool water collision area
        // Pool is in the center, 70% of map size
        const poolSize = this.poolRoom.mapSize * 0.7;
        const poolStart = (this.poolRoom.mapSize - poolSize) / 2;
        
        this.waterAreas.push({
            minX: poolStart,
            maxX: poolStart + poolSize,
            minY: -1.0, // Below floor level
            maxY: 0.05, // Water surface
            minZ: poolStart,
            maxZ: poolStart + poolSize
        });
    }
    
    // Check collision with walls - returns adjusted position
    checkCollision(position, previousPosition, radius = 0.15) { // Even smaller default radius
        if (!this.enabled) return position;
        
        // Create a copy of the position to modify
        let newPosition = [position[0], position[1], position[2]];
        
        // Special window edge check - prevent falling through window but allow getting close
        const isOutsideWorld = (
            newPosition[0] < -0.45 || 
            newPosition[0] > this.poolRoom.mapSize - 0.55 ||
            newPosition[2] < -0.45 || 
            newPosition[2] > this.poolRoom.mapSize - 0.55
        );
        
        if (isOutsideWorld) {
            console.log('Preventing falling outside world');
            // Just reset to previous position if trying to go outside world boundaries
            return previousPosition;
        }
        
        // Detect if we're near a window edge and reduce collision radius further
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
            newPosition[1] = previousPosition[1];
        }
        
        return newPosition;
    }
    
    // Check if a position collides with any collision box
    isPositionColliding(position, radius) {
        for (const box of this.collisionBoxes) {
            // Expand box by radius to account for player size
            if (position[0] + radius > box.minX &&
                position[0] - radius < box.maxX &&
                position[1] + radius > box.minY &&
                position[1] - radius < box.maxY &&
                position[2] + radius > box.minZ &&
                position[2] - radius < box.maxZ) {
                return true;
            }
        }
        return false;
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
                return water.minY; // Return pool bottom
            }
        }
        
        // Otherwise return floor level
        return 0.0;
    }
    
    // Update collision objects when blocks are added/removed
    updateCollisionObjects() {
        this.initCollisionObjects();
    }
}