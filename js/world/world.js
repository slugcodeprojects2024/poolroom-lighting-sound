class World {
    constructor(gl) {
        this.gl = gl;
        // This is a minimal implementation to avoid breaking the engine
        // Will be expanded in a future phase
    }
    
    // Stub method to prevent collision errors
    checkCollision() {
        // Always allow movement for now
        return false;
    }
}