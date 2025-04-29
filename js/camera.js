class Camera {
    constructor() {
        // Camera parameters
        this.fov = 60 * Math.PI / 180; // 60 degrees in radians
        this.aspect = 1;               // Will be updated based on canvas size
        this.near = 0.1;               // Near clipping plane
        this.far = 100.0;              // Far clipping plane
        
        // Camera position and orientation
        this.position = [0, 0, 5];     // Camera position
        this.front = [0, 0, -1];       // Direction the camera is looking
        this.up = [0, 1, 0];           // Up vector
        
        // Orientation angles
        this.yaw = -90;                // Horizontal rotation (degrees)
        this.pitch = 0;                // Vertical rotation (degrees)
        
        // Matrices
        this.viewMatrix = createTransformationMatrix();
        this.projectionMatrix = createTransformationMatrix();
        
        // Update view matrix
        this.updateViewMatrix();
    }
    
    /**
     * Update the view matrix based on camera position and orientation
     */
    updateViewMatrix() {
        // For now, we'll use a simple lookAt implementation
        const target = [
            this.position[0] + this.front[0],
            this.position[1] + this.front[1],
            this.position[2] + this.front[2]
        ];
        
        // Create a new view matrix (simplified lookAt)
        const z = normalizeVector([
            this.position[0] - target[0],
            this.position[1] - target[1],
            this.position[2] - target[2]
        ]);
        
        const x = normalizeVector(crossProduct(this.up, z));
        const y = crossProduct(z, x);
        
        this.viewMatrix = new Float32Array([
            x[0], y[0], z[0], 0,
            x[1], y[1], z[1], 0,
            x[2], y[2], z[2], 0,
            -dotProduct(x, this.position),
            -dotProduct(y, this.position),
            -dotProduct(z, this.position),
            1
        ]);
    }
    
    /**
     * Update the projection matrix based on camera parameters
     * @param {number} aspect - Aspect ratio of the viewport
     */
    updateProjectionMatrix(aspect) {
        this.aspect = aspect;
        
        const f = 1.0 / Math.tan(this.fov / 2);
        const nf = 1.0 / (this.near - this.far);
        
        this.projectionMatrix = new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (this.far + this.near) * nf, -1,
            0, 0, 2 * this.far * this.near * nf, 0
        ]);
    }
    
    /**
     * Move the camera forward (ground-locked)
     * @param {number} distance - Distance to move
     */
    moveForward(distance) {
        // Only use the XZ components for movement (ignore Y/up-down)
        const xzFront = normalizeVector([this.front[0], 0, this.front[2]]);
        
        this.position[0] += xzFront[0] * distance;
        // Y position remains unchanged (locked to ground)
        this.position[2] += xzFront[2] * distance;
        this.updateViewMatrix();
    }
    
    /**
     * Move the camera backward
     * @param {number} distance - Distance to move
     */
    moveBackward(distance) {
        this.moveForward(-distance);
    }
    
    /**
     * Move the camera right (ground-locked)
     * @param {number} distance - Distance to move
     */
    moveRight(distance) {
        const xzFront = normalizeVector([this.front[0], 0, this.front[2]]);
        const right = normalizeVector(crossProduct(xzFront, this.up));
        
        this.position[0] += right[0] * distance;
        // Y position remains unchanged (locked to ground)
        this.position[2] += right[2] * distance;
        this.updateViewMatrix();
    }
    
    /**
     * Move the camera left
     * @param {number} distance - Distance to move
     */
    moveLeft(distance) {
        this.moveRight(-distance);
    }
    
    /**
     * Rotate the camera left around the Y axis
     * @param {number} angle - Angle in radians
     */
    rotateLeft(angle) {
        // Create rotation matrix
        const rotationMatrix = createRotationYMatrix(-angle); // Negative for correct direction
        
        // Apply rotation to front vector
        const rotatedFront = transformVector(rotationMatrix, this.front);
        this.front = normalizeVector(rotatedFront);
        
        this.updateViewMatrix();
    }
    
    /**
     * Rotate the camera right around the Y axis
     * @param {number} angle - Angle in radians
     */
    rotateRight(angle) {
        this.rotateLeft(-angle);
    }
    
    /**
     * Look up and down (pitch)
     * @param {number} amount - Amount to look up/down in radians
     */
    lookUpDown(amount) {
        // Convert amount to degrees for easier constraints
        const degreesAmount = amount * (180 / Math.PI);
        
        // Update pitch with constraints (-89 to 89 degrees)
        this.pitch = Math.max(-89, Math.min(89, this.pitch - degreesAmount));
        
        // Update front vector based on yaw and pitch
        this.updateFrontVector();
    }
    
    /**
     * Look left and right (yaw)
     * @param {number} amount - Amount to look left/right in radians
     */
    lookLeftRight(amount) {
        // Convert amount to degrees
        const degreesAmount = amount * (180 / Math.PI);
        
        // Update yaw
        this.yaw = (this.yaw + degreesAmount) % 360;
        
        // Update front vector based on yaw and pitch
        this.updateFrontVector();
    }
    
    /**
     * Update front vector based on yaw and pitch angles
     */
    updateFrontVector() {
        // Convert angles to radians
        const yawRad = this.yaw * (Math.PI / 180);
        const pitchRad = this.pitch * (Math.PI / 180);
        
        // Calculate front vector
        this.front = [
            Math.cos(yawRad) * Math.cos(pitchRad),
            Math.sin(pitchRad),
            Math.sin(yawRad) * Math.cos(pitchRad)
        ];
        
        // Normalize front vector
        this.front = normalizeVector(this.front);
        
        this.updateViewMatrix();
    }
    
    /**
     * Check for collision and prevent movement if needed
     * @param {World} world - World object to check collisions against
     * @param {Array<number>} newPosition - Potential new position [x, y, z]
     * @returns {boolean} - Whether movement is allowed
     */
    checkCollision(world, newPosition) {
        return !world.checkCollision(newPosition);
    }
    
    /**
     * Move the camera forward with collision detection (ground-locked)
     * @param {number} distance - Distance to move
     * @param {World} world - World object to check collisions against
     */
    moveForwardWithCollision(distance, world) {
        // Only use the XZ components for movement (ignore Y/up-down)
        const xzFront = normalizeVector([this.front[0], 0, this.front[2]]);
        
        // Calculate potential new position
        const newPosition = [
            this.position[0] + xzFront[0] * distance,
            this.position[1], // Keep Y unchanged
            this.position[2] + xzFront[2] * distance
        ];
        
        // Check for collision
        if (this.checkCollision(world, newPosition)) {
            this.position = newPosition;
            this.updateViewMatrix();
        }
    }
    
    /**
     * Move the camera backward with collision detection
     * @param {number} distance - Distance to move
     * @param {World} world - World object to check collisions against
     */
    moveBackwardWithCollision(distance, world) {
        this.moveForwardWithCollision(-distance, world);
    }
    
    /**
     * Move the camera right with collision detection (ground-locked)
     * @param {number} distance - Distance to move
     * @param {World} world - World object to check collisions against
     */
    moveRightWithCollision(distance, world) {
        const xzFront = normalizeVector([this.front[0], 0, this.front[2]]);
        const right = normalizeVector(crossProduct(xzFront, this.up));
        
        // Calculate potential new position
        const newPosition = [
            this.position[0] + right[0] * distance,
            this.position[1], // Keep Y unchanged
            this.position[2] + right[2] * distance
        ];
        
        // Check for collision
        if (this.checkCollision(world, newPosition)) {
            this.position = newPosition;
            this.updateViewMatrix();
        }
    }
    
    /**
     * Move the camera left with collision detection
     * @param {number} distance - Distance to move
     * @param {World} world - World object to check collisions against
     */
    moveLeftWithCollision(distance, world) {
        this.moveRightWithCollision(-distance, world);
    }
}

// Vector helper functions
function normalizeVector(v) {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    
    if (length > 0.0001) {
        return [v[0] / length, v[1] / length, v[2] / length];
    }
    
    return [0, 0, 0];
}

function crossProduct(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

function dotProduct(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function transformVector(matrix, vector) {
    return [
        matrix[0] * vector[0] + matrix[4] * vector[1] + matrix[8] * vector[2],
        matrix[1] * vector[0] + matrix[5] * vector[1] + matrix[9] * vector[2],
        matrix[2] * vector[0] + matrix[6] * vector[1] + matrix[10] * vector[2]
    ];
}