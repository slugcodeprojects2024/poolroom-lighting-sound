// camera.js - Update to create low-perspective camera
class Camera {
    constructor(gl) {
        // Set up camera properties
        this.position = new Vector3([16.0, 0.3, 16.0]); // Low position for scale illusion
        this.front = new Vector3([0.0, 0.0, -1.0]);
        this.up = new Vector3([0.0, 1.0, 0.0]);
        this.right = new Vector3([1.0, 0.0, 0.0]);
        
        // View and projection matrices
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        
        // Camera parameters
        this.speed = 1.0; // Slower speed makes space feel larger
        this.sensitivity = 0.15;
        this.yaw = -90.0; // Default looking forward
        this.pitch = 0.0;
        this.fov = 70.0; // Wider FOV for immersive feel
        
        // Set up projection matrix
        const canvas = gl.canvas;
        const aspect = canvas.width / canvas.height;
        this.projectionMatrix.setPerspective(this.fov, aspect, 0.05, 1000.0);
        
        // Update matrices
        this.updateCameraVectors();
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
        // right = normalize(cross(front, world up))
        this.right = Vector3.cross(this.front, new Vector3([0, 1, 0]));
        this.right.normalize();
        
        // up = normalize(cross(right, front))
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
    
    // Process keyboard input for movement
    processKeyboard(direction, deltaTime) {
        const velocity = this.speed * deltaTime;
        
        if (direction === 'FORWARD') {
            // Move only in XZ plane for walking feel
            const moveVec = new Vector3(this.front.elements);
            moveVec.elements[1] = 0; // Zero Y component
            moveVec.normalize();
            moveVec.mul(velocity);
            this.position.add(moveVec);
        }
        if (direction === 'BACKWARD') {
            const moveVec = new Vector3(this.front.elements);
            moveVec.elements[1] = 0;
            moveVec.normalize();
            moveVec.mul(-velocity);
            this.position.add(moveVec);
        }
        if (direction === 'LEFT') {
            this.position.elements[0] -= this.right.elements[0] * velocity;
            this.position.elements[2] -= this.right.elements[2] * velocity;
        }
        if (direction === 'RIGHT') {
            this.position.elements[0] += this.right.elements[0] * velocity;
            this.position.elements[2] += this.right.elements[2] * velocity;
        }
        
        // Update view matrix after movement
        this.updateCameraVectors();
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
}