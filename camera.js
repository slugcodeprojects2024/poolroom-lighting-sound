// camera.js - Camera class for controlling view and projection matrices

class Camera {
    constructor(canvas) {
        // Camera properties
        this.fov = 60;
        this.eye = new Vector3([10, 2, 15]); // Start in the middle of the pool room, slightly elevated
        this.at = new Vector3([15, 2, 15]);  // Looking toward the hallway
        this.up = new Vector3([0, 1, 0]);  // Up direction
        
        // Create matrices
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        
        // Set up initial matrices
        this.updateViewMatrix();
        this.updateProjectionMatrix(canvas);
        
        // Movement speed
        this.moveSpeed = 0.1;
        this.rotateSpeed = 3.0; // degrees for keys
        this.mouseRotateSpeed = 0.25; // Sensitivity for mouse rotation (degrees per pixel)

        // Mouse control state
        this.isDragging = false;
        this.lastX = -1;
        this.lastY = -1;

        // Add collision handler property
        this.collisionHandler = null;
    }

    // Add method to set collision handler
    setCollisionHandler(handler) {
        this.collisionHandler = handler;
    }
    
    updateViewMatrix() {
        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
        );
    }
    
    updateProjectionMatrix(canvas) {
        this.projectionMatrix.setPerspective(
            this.fov, 
            canvas.width / canvas.height, 
            0.1, 
            1000.0
        );
    }
    
    moveForward() {
        // Calculate forward vector
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.normalize();
        f.mul(this.moveSpeed);
        
        // Calculate new potential eye position
        const newEyePos = new Vector3(this.eye.elements);
        newEyePos.add(f);
        
        // Check for collision
        if (this.collisionHandler) {
            const collision = this.collisionHandler.checkCollision(newEyePos.elements);
            if (collision.collision) {
                return; // Don't move if there's a collision
            }
            
            // Check if in water and adjust movement speed
            const inWater = this.collisionHandler.isInWater(newEyePos.elements);
            if (inWater) {
                f.mul(0.5); // Move slower in water
            }
        }
        
        // Move both eye and at points using the (potentially modified) vector
        this.eye.add(f);
        this.at.add(f);
        
        this.updateViewMatrix();
    }
    
    moveBackwards() {
        // Compute backward vector
        let b = new Vector3();
        b.set(this.eye);
        b.sub(this.at);
        b.normalize();
        b.mul(this.moveSpeed);
        
        // Calculate new potential eye position
        const newEyePos = new Vector3(this.eye.elements);
        newEyePos.add(b);

        // Check for collision
        if (this.collisionHandler) {
            const collision = this.collisionHandler.checkCollision(newEyePos.elements);
            if (collision.collision) {
                return; // Don't move if there's a collision
            }

            // Check if in water and adjust movement speed
            const inWater = this.collisionHandler.isInWater(newEyePos.elements);
            if (inWater) {
                b.mul(0.5); // Move slower in water
            }
        }
        
        // Move both eye and at points
        this.eye.add(b);
        this.at.add(b);
        
        this.updateViewMatrix();
    }
    
    moveLeft() {
        // Compute forward vector
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        
        // Compute the true "right" vector
        let right = Vector3.cross(f, this.up);
        right.normalize();
        right.mul(this.moveSpeed);

        // Calculate the "left" vector
        let left = new Vector3(right.elements);
        left.mul(-1); // Negate the right vector to get left
        
        // Calculate new potential eye position
        const newEyePos = new Vector3(this.eye.elements);
        newEyePos.add(left);

        // Check for collision
        if (this.collisionHandler) {
            const collision = this.collisionHandler.checkCollision(newEyePos.elements);
            if (collision.collision) {
                return; // Don't move if there's a collision
            }

            // Check if in water and adjust movement speed
            const inWater = this.collisionHandler.isInWater(newEyePos.elements);
            if (inWater) {
                left.mul(0.5); // Move slower in water
            }
        }
        
        // To move left, add the left vector
        this.eye.add(left); 
        this.at.add(left);  
        
        this.updateViewMatrix();
    }
    
    moveRight() {
        // Compute forward vector
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        
        // Compute the true "right" vector
        let right = Vector3.cross(f, this.up);
        right.normalize();
        right.mul(this.moveSpeed);
        
        // Calculate new potential eye position
        const newEyePos = new Vector3(this.eye.elements);
        newEyePos.add(right);

        // Check for collision
        if (this.collisionHandler) {
            const collision = this.collisionHandler.checkCollision(newEyePos.elements);
            if (collision.collision) {
                return; // Don't move if there's a collision
            }

            // Check if in water and adjust movement speed
            const inWater = this.collisionHandler.isInWater(newEyePos.elements);
            if (inWater) {
                right.mul(0.5); // Move slower in water
            }
        }
        
        // To move right, add the right vector
        this.eye.add(right); 
        this.at.add(right);  
        
        this.updateViewMatrix();
    }
    
    panLeft() {
        // Compute forward vector
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        
        // Create rotation matrix around up vector
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(this.rotateSpeed, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        
        // Apply rotation to forward vector
        let f_prime = rotationMatrix.multiplyVector3(f);
        
        // Update at point based on rotated forward vector
        this.at.set(this.eye);
        this.at.add(f_prime);
        
        this.updateViewMatrix();
    }
    
    panRight() {
        // Compute forward vector
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        
        // Create rotation matrix around up vector (negative angle)
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(-this.rotateSpeed, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        
        // Apply rotation to forward vector
        let f_prime = rotationMatrix.multiplyVector3(f);
        
        // Update at point based on rotated forward vector
        this.at.set(this.eye);
        this.at.add(f_prime);
        
        this.updateViewMatrix();
    }
    
    moveUp() {
        // Move up in Y direction
        this.eye.elements[1] += this.moveSpeed;
        this.at.elements[1] += this.moveSpeed;
        this.updateViewMatrix();
    }

    moveDown() {
        // Move down in Y direction
        this.eye.elements[1] -= this.moveSpeed;
        this.at.elements[1] -= this.moveSpeed;
        this.updateViewMatrix();
    }

    // --- Mouse Event Handlers ---

    handleMouseDown(ev) {
        const rect = ev.target.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;

        // Start dragging only if mouse is inside canvas
        if (x >= 0 && x < ev.target.width && y >= 0 && y < ev.target.height) {
            this.isDragging = true;
            this.lastX = x;
            this.lastY = y;
        }
    }

    handleMouseUp(ev) {
        this.isDragging = false;
    }

    handleMouseMove(ev) {
        if (!this.isDragging) return;

        const rect = ev.target.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;

        const deltaX = x - this.lastX;
        const deltaY = y - this.lastY;

        // --- Calculate Forward Vector ---
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);

        // --- Pan (Horizontal Rotation based on deltaX) ---
        let panAngle = -deltaX * this.mouseRotateSpeed; // Negative for intuitive rotation
        let panMatrix = new Matrix4();
        panMatrix.setRotate(panAngle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime_pan = panMatrix.multiplyVector3(f); // Rotated forward vector after pan

        // --- Tilt (Vertical Rotation based on deltaY) ---
        // Calculate the right vector based on the *already panned* forward vector
        let right = Vector3.cross(f_prime_pan, this.up);
        right.normalize();

        let tiltAngle = -deltaY * this.mouseRotateSpeed; // Negative for intuitive rotation
        let tiltMatrix = new Matrix4();
        tiltMatrix.setRotate(tiltAngle, right.elements[0], right.elements[1], right.elements[2]);
        let f_prime_tilt = tiltMatrix.multiplyVector3(f_prime_pan); // Final rotated forward vector

        // --- Update Camera 'at' Point ---
        // It's generally better to rotate the 'at' point around the 'eye' point.
        this.at.set(this.eye);
        this.at.add(f_prime_tilt);

        // Update last mouse position
        this.lastX = x;
        this.lastY = y;

        // Update the view matrix
        this.updateViewMatrix();
    }
}