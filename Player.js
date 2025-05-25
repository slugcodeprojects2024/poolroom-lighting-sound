import { Vector3 } from './Vector3.js';

export class Player {
    constructor(initialPosition, poolRoom, inputManager, camera) {
        this.poolRoom = poolRoom;
        this.inputManager = inputManager;
        this.camera = camera; // For updating camera based on player

        this.position = new Vector3([...initialPosition]);
        this.velocity = new Vector3([0, 0, 0]);
        
        // Player properties
        this.dimensions = [0.6, 1.8, 0.6]; // Width, Height, Depth
        this.eyeHeight = 1.6; // Y-offset from player's base to camera position
        this.walkSpeed = 3.0; // Units per second
        this.runSpeed = 6.0;
        this.jumpForce = 7.0; // Initial upward velocity for a jump
        this.climbSpeed = 2.5; // Units per second
        this.gravity = -19.6; // Units per second squared
        
        // Player state
        this.onGround = false;
        this.isClimbing = false;
        this.isSprinting = false;

        // Orientation (for first-person view)
        this.yaw = 0;   // Rotation around Y axis (left/right)
        this.pitch = 0; // Rotation around X axis (up/down)
        this.mouseSensitivity = 0.002;

        this._initMouseLook();
    }

    _initMouseLook() {
        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === this.poolRoom.gl.canvas) {
                this.yaw -= event.movementX * this.mouseSensitivity;
                this.pitch -= event.movementY * this.mouseSensitivity;
                // Clamp pitch to avoid flipping
                this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
            }
        });
    }

    update(deltaTime) {
        const speed = this.inputManager.isKeyPressed('shift') ? this.runSpeed : this.walkSpeed;
        const moveInput = this.inputManager.getMoveDirection();
        
        let potentialLadder = this.poolRoom.getLadderAt(this.position.elements, this.dimensions);

        if (potentialLadder) {
            console.log("Ladder detected at:", potentialLadder.modelMatrix.elements);
            this.onGround = false; // Not on ground when on ladder
            this.velocity.elements[1] = 0; // Stop vertical movement due to gravity

            if (this.inputManager.isClimbingUp()) {
                this.isClimbing = true;
                this.position.elements[1] += this.climbSpeed * deltaTime;
            } else if (this.inputManager.isClimbingDown()) {
                this.isClimbing = true;
                this.position.elements[1] -= this.climbSpeed * deltaTime;
            } else {
                this.isClimbing = true; // Stay in climbing mode, but don't move
            }
            
            // Optional: Add slight magnetic effect to keep player centered on ladder
            const ladderMatrix = potentialLadder.modelMatrix.elements;
            const ladderCenterX = ladderMatrix[12];
            const ladderCenterZ = ladderMatrix[14];
            
            // Smooth interpolation towards ladder center
            this.position.elements[0] = this.position.elements[0] * 0.8 + ladderCenterX * 0.2;
            this.position.elements[2] = this.position.elements[2] * 0.8 + ladderCenterZ * 0.2;
        } else {
            this.isClimbing = false;
            
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

        // Update position based on velocity
        let deltaPosition = new Vector3([...this.velocity.elements]).mul(deltaTime);
        this.position.add(deltaPosition);

        // Handle collisions
        this.handleCollisions();

        // Update camera
        const eyePos = [
            this.position.elements[0],
            this.position.elements[1] + this.eyeHeight,
            this.position.elements[2]
        ];
        const lookAtPos = [
            eyePos[0] + Math.sin(this.yaw) * Math.cos(this.pitch),
            eyePos[1] + Math.sin(this.pitch),
            eyePos[2] + Math.cos(this.yaw) * Math.cos(this.pitch)
        ];
        this.camera.lookAt(eyePos[0], eyePos[1], eyePos[2], lookAtPos[0], lookAtPos[1], lookAtPos[2], 0, 1, 0);
    }

    handleCollisions() {
        // Basic floor collision
        // Assumes ground is at Y=0 for simplicity.
        // In your PoolRoom, floor blocks are at y=0, with height 0.1.
        // Player's base is at this.position.elements[1].
        const floorLevel = 0.0; // Or slightly above if player sinks into ground blocks
        if (this.position.elements[1] < floorLevel && !this.isClimbing) {
            this.position.elements[1] = floorLevel;
            this.velocity.elements[1] = 0;
            this.onGround = true;
        } else if (!this.isClimbing) {
             this.onGround = false; // If not touching floor and not climbing
        }

        // TODO: Add Wall Collision
        // Iterate through poolRoom.cubes (walls, pillars)
        // Perform AABB collision checks and resolve overlaps.
        // This is more complex and would involve checking against `this.poolRoom.map` or `this.poolRoom.cubes`.
        // For now, the player might pass through walls.
    }
} 