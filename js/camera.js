const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;

class Camera {
    constructor(aspectRatio, fov = Math.PI / 4, near = 0.1, far = 100.0) {
        this.position = vec3.create(); // Use alias
        this.front = vec3.fromValues(0, 0, -1); // Use alias
        this.up = vec3.fromValues(0, 1, 0); // Use alias
        this.right = vec3.create(); // Use alias
        this.worldUp = vec3.fromValues(0, 1, 0); // Use alias

        this.yaw = -Math.PI / 2; // Initialize yaw
        this.pitch = 0.0;        // Initialize pitch

        this.viewMatrix = mat4.create(); // Use alias
        this.projectionMatrix = mat4.create(); // Use alias

        mat4.perspective(this.projectionMatrix, fov, aspectRatio, near, far); // Use alias
        this.updateCameraVectors();
        this.updateViewMatrix();
    }
    
    /**
     * Update the view matrix based on camera position and orientation vectors
     */
    updateViewMatrix() {
        const center = vec3.create();
        vec3.add(center, this.position, this.front); // Use alias
        mat4.lookAt(this.viewMatrix, this.position, center, this.up); // Use alias
    }
    
    /**
     * Recalculates front, right, and up vectors based on yaw and pitch angles.
     */
    updateCameraVectors() {
        // Calculate the new Front vector
        const frontVec = vec3.create(); // Use alias
        frontVec[0] = Math.cos(this.yaw) * Math.cos(this.pitch);
        frontVec[1] = Math.sin(this.pitch);
        frontVec[2] = Math.sin(this.yaw) * Math.cos(this.pitch);
        vec3.normalize(this.front, frontVec); // Use alias

        // Recalculate the Right vector
        vec3.cross(this.right, this.front, this.worldUp); // Use alias
        vec3.normalize(this.right, this.right); // Use alias

        // Recalculate the Up vector
        vec3.cross(this.up, this.right, this.front); // Use alias
        vec3.normalize(this.up, this.up); // Use alias
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
            0, 0, (this.far + this.near) * nf, -1, // Check matrix convention if issues arise
            0, 0, 2 * this.far * this.near * nf, 0
        ]);
    }
    
    /**
     * Move the camera forward/backward on the horizontal plane
     * @param {number} distance - Distance to move (+ forward, - backward)
     */
    moveForward(distance) {
        const displacement = vec3.create(); // Use alias
        vec3.scale(displacement, this.front, distance); // Use alias
        vec3.add(this.position, this.position, displacement); // Use alias
        
        this.updateViewMatrix(); // Position changed, update matrix
    }
    
    /**
     * Move the camera backward on the horizontal plane
     * @param {number} distance - Distance to move
     */
    moveBackward(distance) {
        this.moveForward(-distance);
    }
    
    /**
     * Move the camera right/left on the horizontal plane
     * @param {number} distance - Distance to move (+ right, - left)
     */
    moveRight(distance) {
        const displacement = vec3.create(); // Use alias
        vec3.scale(displacement, this.right, distance); // Use alias
        vec3.add(this.position, this.position, displacement); // Use alias
        
        this.updateViewMatrix(); // Position changed, update matrix
    }
    
    /**
     * Move the camera left on the horizontal plane
     * @param {number} distance - Distance to move
     */
    moveLeft(distance) {
        this.moveRight(-distance);
    }
    
    /**
     * Rotate the camera left (decrease yaw)
     * @param {number} angle - Angle in radians to decrease yaw by
     */
    rotateLeft(angle) {
        this.yaw -= angle;
        this.updateCameraVectors(); // Orientation changed, update vectors and matrix
    }
    
    /**
     * Rotate the camera right (increase yaw)
     * @param {number} angle - Angle in radians to increase yaw by
     */
    rotateRight(angle) {
        this.yaw += angle;
        this.updateCameraVectors(); // Orientation changed, update vectors and matrix
    }
    
    /**
     * Processes mouse movement input to rotate the camera.
     * @param {number} xoffset - Change in mouse X position.
     * @param {number} yoffset - Change in mouse Y position.
     * @param {boolean} constrainPitch - If true, constrain the pitch angle.
     */
    processMouseMovement(xoffset, yoffset, constrainPitch = true) {
        xoffset *= this.mouseSensitivity;
        yoffset *= this.mouseSensitivity;
        
        this.yaw += xoffset;
        this.pitch += yoffset; // Note: yoffset might need negation depending on coordinate system
        
        // Constrain pitch to avoid flipping
        if (constrainPitch) {
            const limit = Math.PI / 2 - 0.01; // Limit to slightly less than 90 degrees
            if (this.pitch > limit) this.pitch = limit;
            if (this.pitch < -limit) this.pitch = -limit;
        }
        
        // Update front, right, and up vectors based on new yaw/pitch
        this.updateCameraVectors();
    }

    /**
     * Apply jump force if on the ground
     */
    jump() {
        if (this.isOnGround) {
            this.velocityY = this.jumpStrength;
            this.isOnGround = false; // No longer on the ground after jumping
        }
    }

    /**
     * Update camera physics (gravity, ground collision)
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updatePhysics(deltaTime) {
        // Apply gravity if not on the ground
        if (!this.isOnGround) {
            this.velocityY += this.gravity * deltaTime;
        }

        // Update vertical position
        this.position[1] += this.velocityY * deltaTime;

        // Simple ground collision detection
        const groundPosition = this.groundLevel + this.eyeHeight;
        if (this.position[1] <= groundPosition) {
            this.position[1] = groundPosition; // Snap to ground
            this.velocityY = 0;                // Stop falling
            this.isOnGround = true;
        } else {
            this.isOnGround = false; // In the air
        }

        // Update view matrix if position changed due to physics
        this.updateViewMatrix();
    }
}