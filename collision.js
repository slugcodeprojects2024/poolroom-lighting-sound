// collision.js - Modified to work with the new PoolRoom class

class CollisionHandler {
    constructor(poolRoom) {
        this.poolRoom = poolRoom;
        this.collisionObjects = [];
        this.waterAreas = [];
        this.enabled = false; // Collision detection starts disabled
        
        // Initialize collision objects if poolRoom is provided
        if (poolRoom) {
            this.initCollisionObjects();
        }
    }
    
    // Toggle collision detection on/off
    toggleCollision() {
        this.enabled = !this.enabled;
        console.log("Collision detection: " + (this.enabled ? "Enabled" : "Disabled"));
        return this.enabled;
    }
    
    initCollisionObjects() {
        // Create collision boxes for walls and other solid objects
        const allSpaces = [...this.poolRoom.rooms, ...this.poolRoom.corridors];
        
        for (const room of allSpaces) {
            // Create wall collision boxes only where walls exist
            
            // North wall
            if (!this.poolRoom.hasAdjacentRoom(room, 'north')) {
                this.collisionObjects.push({
                    type: 'wall',
                    minX: room.x,
                    maxX: room.x + room.width,
                    minY: room.y,
                    maxY: room.y + room.height,
                    minZ: room.z - 0.5,
                    maxZ: room.z + 0.5
                });
            }
            
            // South wall
            if (!this.poolRoom.hasAdjacentRoom(room, 'south')) {
                this.collisionObjects.push({
                    type: 'wall',
                    minX: room.x,
                    maxX: room.x + room.width,
                    minY: room.y,
                    maxY: room.y + room.height,
                    minZ: room.z + room.length - 0.5,
                    maxZ: room.z + room.length + 0.5
                });
            }
            
            // East wall
            if (!this.poolRoom.hasAdjacentRoom(room, 'east')) {
                this.collisionObjects.push({
                    type: 'wall',
                    minX: room.x + room.width - 0.5,
                    maxX: room.x + room.width + 0.5,
                    minY: room.y,
                    maxY: room.y + room.height,
                    minZ: room.z,
                    maxZ: room.z + room.length
                });
            }
            
            // West wall
            if (!this.poolRoom.hasAdjacentRoom(room, 'west')) {
                this.collisionObjects.push({
                    type: 'wall',
                    minX: room.x - 0.5,
                    maxX: room.x + 0.5,
                    minY: room.y,
                    maxY: room.y + room.height,
                    minZ: room.z,
                    maxZ: room.z + room.length
                });
            }
            
            // If room has a pool, add water area
            if (room.hasPool) {
                const poolMargin = 3;
                this.waterAreas.push({
                    type: 'water',
                    minX: room.x + poolMargin,
                    maxX: room.x + room.width - poolMargin,
                    minY: room.y - room.poolDepth,
                    maxY: room.y,
                    minZ: room.z + poolMargin,
                    maxZ: room.z + room.length - poolMargin
                });
            }
        }
    }
    
    // Check for collisions with a player's position
    checkCollision(position, radius = 0.5) {
        if (!this.enabled) return { collision: false };
        
        for (const obj of this.collisionObjects) {
            // Simple box-sphere collision check
            const closestX = Math.max(obj.minX, Math.min(position[0], obj.maxX));
            const closestY = Math.max(obj.minY, Math.min(position[1], obj.maxY));
            const closestZ = Math.max(obj.minZ, Math.min(position[2], obj.maxZ));
            
            const distance = Math.sqrt(
                (position[0] - closestX) * (position[0] - closestX) +
                (position[1] - closestY) * (position[1] - closestY) +
                (position[2] - closestZ) * (position[2] - closestZ)
            );
            
            if (distance < radius) {
                return {
                    collision: true,
                    object: obj
                };
            }
        }
        
        return {
            collision: false
        };
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
}