// camera.js - Update to include collision detection and sprint, preserving scale illusion
class Camera {
    constructor(gl) {
        // Set up camera properties - PRESERVE LOW POSITION FOR SCALE ILLUSION
        this.position = new Vector3([3.0, 0.3, 12.0]); // Low position maintained for scale illusion
        this.previousPosition = new Vector3([3.0, 0.3, 12.0]);
        this.front = new Vector3([0.0, 0.0, -1.0]);
        this.up = new Vector3([0.0, 1.0, 0.0]);
        this.right = new Vector3([1.0, 0.0, 0.0]);
        
        // View and projection matrices
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        
        // Camera parameters - PRESERVE FOR SCALE ILLUSION
        this.baseSpeed = 1.0; // Base movement speed (slow for scale illusion)
        this.sprintMultiplier = 2.0; // Sprint speed multiplier
        this.currentSpeed = this.baseSpeed;
        this.sensitivity = 0.15;
        this.yaw = -90.0; // Default looking forward
        this.pitch = 0.0;
        this.fov = 70.0; // Wide FOV maintained for immersive feel
        
        // Physics properties
        this.velocity = new Vector3([0, 0, 0]);
        this.gravity = -2.5; // Reduced gravity to maintain scale illusion
        this.jumpVelocity = 1.5; // Reduced jump height for scale
        this.isGrounded = true;
        this.collisionHandler = null; // Will be set from main.js
        
        // Sprint properties
        this.isSprinting = false;
        this.staminaMax = 100;
        this.stamina = this.staminaMax;
        this.staminaDrainRate = 20; // Stamina units per second while sprinting
        this.staminaRegenRate = 10; // Stamina units per second while not sprinting
        
        // Set up projection matrix
        const canvas = gl.canvas;
        const aspect = canvas.width / canvas.height;
        this.projectionMatrix.setPerspective(this.fov, aspect, 0.05, 1000.0);
        
        // Update matrices
        this.updateCameraVectors();
    }
    
    // Set collision handler
    setCollisionHandler(handler) {
        this.collisionHandler = handler;
    }
    
    // Update camera vectors based on yaw and pitch
    updateCameraVectors() {
        // Calculate new front vector
        const radYaw = this.yaw * Math.PI / 180;
        const radPitch = this.pitch * Math.PI / 180;
        
        this.front.elements[0] = Math.cos(radPitch) * Math.sin(radYaw);
        this.front.elements[1] = Math.sin(radPitch);
        this.front.elements[2] = Math.cos(radPitch) * Math.cos(radYaw);
        this.front.normalize();
        
        // Recalculate right and up vectors
        this.right = Vector3.cross(this.front, new Vector3([0, 1, 0]));
        this.right.normalize();
        
        this.up = Vector3.cross(this.right, this.front);
        this.up.normalize();
        
        // Update view matrix
        const target = new Vector3();
        target.elements[0] = this.position.elements[0] + this.front.elements[0];
        target.elements[1] = this.position.elements[1] + this.front.elements[1];
        target.elements[2] = this.position.elements[2] + this.front.elements[2];
        
        this.viewMatrix.setLookAt(
            this.position.elements[0], this.position.elements[1], this.position.elements[2],
            target.elements[0], target.elements[1], target.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
        );
    }
    
    // Toggle sprint on/off
    setSprint(sprinting) {
        if (sprinting && this.stamina > 0) {
            this.isSprinting = true;
            this.currentSpeed = this.baseSpeed * this.sprintMultiplier;
        } else {
            this.isSprinting = false;
            this.currentSpeed = this.baseSpeed;
        }
    }
    
    // Update stamina based on sprint state
    updateStamina(deltaTime) {
        if (this.isSprinting) {
            // Drain stamina while sprinting
            this.stamina -= this.staminaDrainRate * deltaTime;
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.setSprint(false); // Stop sprinting when out of stamina
            }
        } else {
            // Regenerate stamina while not sprinting
            this.stamina += this.staminaRegenRate * deltaTime;
            if (this.stamina > this.staminaMax) {
                this.stamina = this.staminaMax;
            }
        }
    }
    
    // Process keyboard input for movement with collision detection
    processKeyboard(direction, deltaTime) {
        const velocity = this.currentSpeed * deltaTime;
        
        // Store previous position for collision detection
        this.previousPosition.set(this.position);
        
        // Calculate new position based on input
        let newPosition = new Vector3(this.position.elements);
        
        if (direction === 'FORWARD') {
            const moveVec = new Vector3(this.front.elements);
            moveVec.elements[1] = 0; // Zero Y component for walking
            moveVec.normalize();
            moveVec.mul(velocity);
            newPosition.add(moveVec);
        }
        if (direction === 'BACKWARD') {
            const moveVec = new Vector3(this.front.elements);
            moveVec.elements[1] = 0;
            moveVec.normalize();
            moveVec.mul(-velocity);
            newPosition.add(moveVec);
        }
        if (direction === 'LEFT') {
            newPosition.elements[0] -= this.right.elements[0] * velocity;
            newPosition.elements[2] -= this.right.elements[2] * velocity;
        }
        if (direction === 'RIGHT') {
            newPosition.elements[0] += this.right.elements[0] * velocity;
            newPosition.elements[2] += this.right.elements[2] * velocity;
        }
        
        // Apply collision detection if available
        if (this.collisionHandler) {
            const checkedPosition = this.collisionHandler.checkCollision(
                newPosition.elements,
                this.previousPosition.elements,
                0.2 // Small player radius for scale illusion
            );
            
            this.position.elements[0] = checkedPosition[0];
            this.position.elements[1] = checkedPosition[1];
            this.position.elements[2] = checkedPosition[2];
        } else {
            this.position.set(newPosition);
        }
        
        // Update view matrix after movement
        this.updateCameraVectors();
    }
    
    // Update physics (gravity, jumping, etc.)
    updatePhysics(deltaTime) {
        if (!this.collisionHandler) return;
        
        // Update stamina
        this.updateStamina(deltaTime);
        
        // Update water physics if in pool
        this.updateWaterPhysics(deltaTime);
        
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.elements[1] += this.gravity * deltaTime;
        }
        
        // Apply velocity
        const newPos = new Vector3(this.position.elements);
        newPos.elements[0] += this.velocity.elements[0] * deltaTime;
        newPos.elements[1] += this.velocity.elements[1] * deltaTime;
        newPos.elements[2] += this.velocity.elements[2] * deltaTime;
        
        // Check ground collision - MAINTAIN LOW HEIGHT FOR SCALE
        const groundLevel = this.collisionHandler.getGroundLevel(
            this.position.elements[0],
            this.position.elements[2]
        ) + 0.3; // Low height maintained for scale illusion
        
        if (newPos.elements[1] <= groundLevel) {
            newPos.elements[1] = groundLevel;
            this.velocity.elements[1] = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
        
        // Apply collision detection
        const checkedPosition = this.collisionHandler.checkCollision(
            newPos.elements,
            this.position.elements,
            0.2 // Small radius for scale
        );
        
        this.position.elements[0] = checkedPosition[0];
        this.position.elements[1] = checkedPosition[1];
        this.position.elements[2] = checkedPosition[2];
        
        // Update view matrix
        this.updateCameraVectors();
    }
    
    // Handle water physics when in water
    updateWaterPhysics(deltaTime) {
        if (!this.collisionHandler) return;
        
        // Check if in water
        const isInWater = this.collisionHandler.isInWater(this.position.elements);
        
        if (isInWater) {
            // Apply buoyancy - counteracts gravity when in water
            const buoyancy = 1.8; // Adjust to control floating force
            this.velocity.elements[1] += buoyancy * deltaTime;
            
            // Apply water resistance - slows movement in all directions
            const waterResistance = 0.92;
            this.velocity.elements[0] *= waterResistance;
            this.velocity.elements[1] *= waterResistance; // Slower vertical movement in water
            this.velocity.elements[2] *= waterResistance;
            
            // Reduce jump force when in water
            this.jumpVelocity = 0.8; // Lower jump in water
            
            // Reduce speed when in water
            this.currentSpeed = this.baseSpeed * 0.6;
            
            // Add visual effects for water (if desired)
            // e.g., screen overlay, sound effects, etc.
        } else {
            // Reset to normal physics when out of water
            this.jumpVelocity = 1.5; // Normal jump height
            
            // Reset speed based on sprint state
            this.currentSpeed = this.isSprinting ? (this.baseSpeed * this.sprintMultiplier) : this.baseSpeed;
        }
    }
    
    // Process jump input
    jump() {
        if (this.isGrounded) {
            this.velocity.elements[1] = this.jumpVelocity;
            this.isGrounded = false;
        }
    }
    
    // Process mouse movement
    processMouseMovement(xoffset, yoffset) {
        xoffset *= this.sensitivity;
        yoffset *= this.sensitivity;
        
        this.yaw += xoffset;
        this.pitch -= yoffset;
        
        // Constrain pitch to avoid flipping
        if (this.pitch > 89.0) this.pitch = 89.0;
        if (this.pitch < -89.0) this.pitch = -89.0;
        
        // Update camera vectors with new orientation
        this.updateCameraVectors();
    }
    
    // Process keyboard rotation (Q/E keys)
    processKeyboardRotation(direction) {
        if (direction === 'LEFT') {
            this.yaw += 2.0; // Q key pans left
        }
        if (direction === 'RIGHT') {
            this.yaw -= 2.0; // E key pans right
        }
        
        // Update camera vectors with new orientation
        this.updateCameraVectors();
    }
    
    // Get the grid position in front of the camera
    getFrontGridPosition(distance = 1.5) {
        const pos = new Vector3(this.position.elements);
        const dir = new Vector3(this.front.elements);
        dir.mul(distance);
        pos.add(dir);
        
        // Round to nearest integer to get grid position
        return {
            x: Math.round(pos.elements[0]),
            y: Math.round(pos.elements[1]),
            z: Math.round(pos.elements[2])
        };
    }
    
    // Get stamina percentage for UI display
    getStaminaPercentage() {
        return (this.stamina / this.staminaMax) * 100;
    }

    // Cast a ray and find where it hits a block
    getTargetBlock(distance = 5.0, resolution = 0.1) {
        // Get camera position and direction
        const cameraPos = this.position.elements;
        const dir = new Vector3([
            this.front.elements[0],
            this.front.elements[1],
            this.front.elements[2]
        ]);
        dir.normalize();
        
        // Ray marching to find intersection
        let currentPoint = [cameraPos[0], cameraPos[1], cameraPos[2]];
        let lastPoint = [...currentPoint]; // Copy initial position
        
        // Step along the ray
        for (let d = 0; d <= distance; d += resolution) {
            // Save last position before updating
            lastPoint = [...currentPoint];
            
            // Calculate current position
            currentPoint[0] = cameraPos[0] + dir.elements[0] * d;
            currentPoint[1] = cameraPos[1] + dir.elements[1] * d;
            currentPoint[2] = cameraPos[2] + dir.elements[2] * d;
            
            // Convert to grid coordinates
            const gridX = Math.round(currentPoint[0]);
            const gridY = Math.round(currentPoint[1]);
            const gridZ = Math.round(currentPoint[2]);
            
            // Skip positions outside the valid range
            if (gridX < 0 || gridX >= this.collisionHandler.poolRoom.mapSize ||
                gridY < 0 || gridY >= this.collisionHandler.poolRoom.maxHeight ||
                gridZ < 0 || gridZ >= this.collisionHandler.poolRoom.mapSize) {
                continue;
            }
            
            // Check if we're looking at an existing block/wall
            if (this.checkBlockAt(gridX, gridY, gridZ)) {
                // Convert last position to grid for placement
                const placeX = Math.round(lastPoint[0]);
                const placeY = Math.round(lastPoint[1]);
                const placeZ = Math.round(lastPoint[2]);
                
                return {
                    x: placeX,
                    y: placeY,
                    z: placeZ,
                    hitBlock: { x: gridX, y: gridY, z: gridZ }
                };
            }
        }
        
        // If no hit, return the end point of the ray
        const endX = Math.round(currentPoint[0]);
        const endY = Math.round(currentPoint[1]);
        const endZ = Math.round(currentPoint[2]);
        
        return {
            x: endX,
            y: endY, 
            z: endZ,
            hitBlock: null
        };
    }

    // Helper method to check if a block exists at a position
    checkBlockAt(x, y, z) {
        if (!this.collisionHandler) return false;
        
        // Check if this is a wall from the map
        if (y < this.collisionHandler.poolRoom.map[x][z]) {
            return true;
        }
        
        // Check if there's a player-placed block here
        for (const cube of this.collisionHandler.poolRoom.cubes) {
            const matrix = cube.modelMatrix.elements;
            
            // Check position with tolerance for smaller blocks
            if (Math.abs(matrix[12] - x) < 0.4 && 
                Math.abs(matrix[13] - (y + 0.5)) < 0.4 && 
                Math.abs(matrix[14] - z) < 0.4) {
                return true;
            }
        }
        
        return false;
    }
}

// Add this method to CollisionHandler in collision.js:
// filepath: c:\Users\15622\Desktop\UCSC Classes\CSE 160\asg3\collision.js

// Check if block exists at specific coordinates
// This should be added as a method inside the CollisionHandler class in collision.js, not here.
// Remove this from camera.js to fix the error.