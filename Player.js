import { Vector3 } from './Vector3.js';

export class Player {
    constructor(initialPosition, poolRoom, inputManager, camera) {
        this.poolRoom = poolRoom;
        this.inputManager = inputManager;
        this.camera = camera;

        this.position = new Vector3([...initialPosition]);
        this.velocity = new Vector3([0, 0, 0]);
        
        // Player properties
        this.dimensions = [0.6, 1.8, 0.6]; // Width, Height, Depth
        this.eyeHeight = 1.6;
        this.walkSpeed = 3.0;
        this.runSpeed = 6.0;
        this.jumpForce = 7.0;
        this.climbSpeed = 2.5;
        this.gravity = -19.6;
        
        // Player state
        this.onGround = false;
        this.isClimbing = false;
        this.isSprinting = false;
        this.isGrabbingLadder = false;

        // Orientation
        this.yaw = 0;
        this.pitch = 0;
        this.mouseSensitivity = 0.002;

        this._initMouseLook();
        this._initLadderControls();
    }

    updateLadderUI(nearLadder) {
        // Show/hide ladder interaction hint
        if (nearLadder && !this.isGrabbingLadder) {
            if (window.showLadderHint) window.showLadderHint();
        } else {
            if (window.hideLadderHint) window.hideLadderHint();
        }

        // Show/hide climbing indicator
        if (this.isGrabbingLadder) {
            if (window.showClimbingIndicator) window.showClimbingIndicator();
        } else {
            if (window.hideClimbingIndicator) window.hideClimbingIndicator();
        }
    }

    _initMouseLook() {
        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === this.poolRoom.gl.canvas) {
                this.yaw -= event.movementX * this.mouseSensitivity;
                this.pitch -= event.movementY * this.mouseSensitivity;
                this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
            }
        });
    }

    _initLadderControls() {
        // Add click handler for grabbing/releasing ladders
        document.addEventListener('click', () => {
            if (document.pointerLockElement === this.poolRoom.gl.canvas) {
                const nearLadder = this.poolRoom.getLadderAt(this.position.elements, this.dimensions);
                if (nearLadder) {
                    this.toggleLadderGrab();
                }
            }
        });

        // Add keyboard handler for ladder grab toggle
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyF' || event.code === 'ControlLeft') {
                const nearLadder = this.poolRoom.getLadderAt(this.position.elements, this.dimensions);
                if (nearLadder) {
                    this.toggleLadderGrab();
                }
            }
        });
    }

    toggleLadderGrab() {
        const nearLadder = this.poolRoom.getLadderAt(this.position.elements, this.dimensions);
        
        if (nearLadder && !this.isGrabbingLadder) {
            // Start climbing
            this.isGrabbingLadder = true;
            this.isClimbing = true;
            this.onGround = false;
            
            // Snap to ladder center
            const ladderMatrix = nearLadder.modelMatrix.elements;
            this.position.elements[0] = ladderMatrix[12];
            this.position.elements[2] = ladderMatrix[14];
            
            // Stop horizontal movement
            this.velocity.elements[0] = 0;
            this.velocity.elements[2] = 0;
            
            console.log('Started climbing ladder');
            
            // Update UI
            if (window.showClimbingIndicator) window.showClimbingIndicator();
            if (window.hideLadderHint) window.hideLadderHint();
        } else if (this.isGrabbingLadder) {
            // Stop climbing
            this.isGrabbingLadder = false;
            this.isClimbing = false;
            this.velocity.elements[1] = 0; // Stop vertical movement
            
            console.log('Stopped climbing ladder');
            
            // Update UI
            if (window.hideClimbingIndicator) window.hideClimbingIndicator();
        }
    }

    update(deltaTime) {
        const speed = this.inputManager.isKeyPressed('shift') ? this.runSpeed : this.walkSpeed;
        const moveInput = this.inputManager.getMoveDirection();
        
        // Check if near a ladder
        const nearLadder = this.poolRoom.getLadderAt(this.position.elements, this.dimensions);

        // Update UI based on ladder proximity
        this.updateLadderUI(nearLadder);

        if (this.isGrabbingLadder && nearLadder) {
            // LADDER CLIMBING MODE
            this.handleLadderClimbing(deltaTime);
        } else {
            // NORMAL MOVEMENT MODE
            if (this.isGrabbingLadder) {
                // Lost ladder contact, stop climbing
                this.isGrabbingLadder = false;
                this.isClimbing = false;
            }
            
            this.handleNormalMovement(deltaTime, speed, moveInput);
        }

        // Update position based on velocity
        let deltaPosition = new Vector3([...this.velocity.elements]).mul(deltaTime);
        this.position.add(deltaPosition);

        // Handle collisions
        this.handleCollisions();

        // Update camera
        this.updateCamera();
    }

    handleLadderClimbing(deltaTime) {
        // Zero out gravity and horizontal movement
        this.velocity.elements[0] = 0;
        this.velocity.elements[2] = 0;
        this.velocity.elements[1] = 0;
        
        // Handle vertical movement on ladder
        if (this.inputManager.isKeyPressed('w')) {
            this.velocity.elements[1] = this.climbSpeed;
        } else if (this.inputManager.isKeyPressed('s')) {
            this.velocity.elements[1] = -this.climbSpeed;
        }
        
        // Keep player centered on ladder
        const nearLadder = this.poolRoom.getLadderAt(this.position.elements, this.dimensions);
        if (nearLadder) {
            const ladderMatrix = nearLadder.modelMatrix.elements;
            this.position.elements[0] = ladderMatrix[12];
            this.position.elements[2] = ladderMatrix[14];
        }
        
        // Prevent climbing too high or too low
        if (this.position.elements[1] < -1.0) {
            this.position.elements[1] = -1.0;
            this.velocity.elements[1] = 0;
        }
        if (this.position.elements[1] > this.poolRoom.maxHeight + 1) {
            this.position.elements[1] = this.poolRoom.maxHeight + 1;
            this.velocity.elements[1] = 0;
        }
    }

    handleNormalMovement(deltaTime, speed, moveInput) {
        // Apply gravity
        this.velocity.elements[1] += this.gravity * deltaTime;

        // Horizontal movement (FPS style)
        let moveDirection = new Vector3([0, 0, 0]);
        if (moveInput.forward !== 0 || moveInput.right !== 0) {
            const forwardVec = new Vector3([Math.sin(this.yaw), 0, Math.cos(this.yaw)]);
            const rightVec = new Vector3([Math.sin(this.yaw + Math.PI / 2), 0, Math.cos(this.yaw + Math.PI / 2)]);
            
            forwardVec.mul(moveInput.forward);
            rightVec.mul(moveInput.right);

            moveDirection.add(forwardVec).add(rightVec);
            if (moveDirection.magnitude() > 0) {
                moveDirection.normalize();
            }
            moveDirection.mul(speed * deltaTime);
            this.velocity.elements[0] = moveDirection.elements[0] / deltaTime;
            this.velocity.elements[2] = moveDirection.elements[2] / deltaTime;
        } else {
            this.velocity.elements[0] = 0;
            this.velocity.elements[2] = 0;
        }

        // Jumping
        if (this.onGround && this.inputManager.isJumping()) {
            this.velocity.elements[1] = this.jumpForce;
            this.onGround = false;
        }
    }

    updateCamera() {
        // Update camera position to match player
        this.camera.position.elements[0] = this.position.elements[0];
        this.camera.position.elements[1] = this.position.elements[1] + this.eyeHeight;
        this.camera.position.elements[2] = this.position.elements[2];
        
        // Update camera orientation
        this.camera.yaw = this.yaw * 180 / Math.PI; // Convert to degrees
        this.camera.pitch = this.pitch * 180 / Math.PI; // Convert to degrees
        
        // Update camera vectors and view matrix
        if (this.camera.updateCameraVectors) {
            this.camera.updateCameraVectors();
        }
    }

    handleCollisions() {
        // Basic floor collision
        const floorLevel = 0.0;
        if (this.position.elements[1] < floorLevel && !this.isClimbing) {
            this.position.elements[1] = floorLevel;
            this.velocity.elements[1] = 0;
            this.onGround = true;
        } else if (!this.isClimbing) {
            this.onGround = false;
        }
    }

    // Get current status for debugging
    getStatus() {
        return {
            position: this.position.elements,
            isClimbing: this.isClimbing,
            isGrabbingLadder: this.isGrabbingLadder,
            onGround: this.onGround,
            velocity: this.velocity.elements
        };
    }
}