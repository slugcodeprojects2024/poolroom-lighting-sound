// world.js - Modified to use the improved room generator

class World {
    constructor(gl) {
        this.gl = gl;
        this.objects = [];
        this.sky = null;
        
        // Create a PoolRoom instance with a specific seed for predictable generation
        this.poolRoom = new PoolRoom(12345);
        
        // Initialize world objects
        this.initWorld();
    }
    
    initWorld() {
        // Create sky box (very large cube)
        this.sky = new Cube(this.gl);
        this.sky.setPosition(0, 20, 0); // Center it on the complex
        this.sky.setScale(1000, 1000, 1000);
        
        // Get objects from pool room generator
        this.objects = this.poolRoom.buildWorldRepresentation(this.gl);
    }
    
    render(gl, program, viewMatrix, projectionMatrix) {
        // Set the base color for sky
        const baseColor = gl.getUniformLocation(program, 'u_baseColor');
        gl.uniform4f(baseColor, 0.5, 0.7, 1.0, 1.0); // Light blue color
        
        // Render sky with base color (no texture)
        this.sky.render(gl, program, viewMatrix, projectionMatrix, 0.0);
        
        // Render all pool room objects
        for (const obj of this.objects) {
            // Set the appropriate color based on object type
            switch (obj.type) {
                case 'floor':
                    if (obj.roomType === 'MAIN_POOL' || obj.roomType === 'KIDS_POOL') {
                        gl.uniform4f(baseColor, 0.9, 0.9, 0.9, 1.0); // White tile for pool areas
                    } else if (obj.roomType === 'LOCKER_ROOM') {
                        gl.uniform4f(baseColor, 0.7, 0.7, 0.7, 1.0); // Gray for locker room
                    } else if (obj.roomType === 'SHOWER_ROOM') {
                        gl.uniform4f(baseColor, 0.8, 0.8, 0.8, 1.0); // Light gray for shower room
                    } else {
                        gl.uniform4f(baseColor, 0.85, 0.85, 0.85, 1.0); // Default floor color
                    }
                    break;
                case 'ceiling':
                    gl.uniform4f(baseColor, 0.95, 0.95, 0.95, 1.0); // White ceiling
                    break;
                case 'wall':
                    if (obj.roomType === 'MAIN_POOL' || obj.roomType === 'KIDS_POOL') {
                        gl.uniform4f(baseColor, 0.9, 0.6, 0.3, 1.0); // Brighter walls for pool rooms
                    } else if (obj.roomType === 'LOCKER_ROOM') {
                        gl.uniform4f(baseColor, 0.7, 0.5, 0.3, 1.0); // Darker walls for locker room
                    } else if (obj.roomType === 'SHOWER_ROOM') {
                        gl.uniform4f(baseColor, 0.75, 0.55, 0.35, 1.0); // Similar walls for shower room
                    } else {
                        gl.uniform4f(baseColor, 0.8, 0.6, 0.4, 1.0); // Default wall color
                    }
                    break;
                case 'water':
                    gl.uniform4f(baseColor, 0.2, 0.6, 0.9, 0.8); // Blue water
                    break;
                case 'pool_floor':
                    gl.uniform4f(baseColor, 0.3, 0.7, 0.8, 1.0); // Turquoise pool floor
                    break;
                case 'pool_wall':
                    gl.uniform4f(baseColor, 0.5, 0.8, 0.9, 1.0); // Light blue pool walls
                    break;
                case 'ladder':
                    gl.uniform4f(baseColor, 0.9, 0.9, 0.9, 1.0); // White ladder
                    break;
                case 'diving_board':
                    gl.uniform4f(baseColor, 0.9, 0.9, 0.9, 1.0); // White diving board
                    break;
                case 'diving_stand':
                    gl.uniform4f(baseColor, 0.6, 0.6, 0.6, 1.0); // Gray stand
                    break;
                default:
                    gl.uniform4f(baseColor, 0.7, 0.7, 0.7, 1.0); // Default gray
            }
            
            // Render the object
            obj.cube.render(gl, program, viewMatrix, projectionMatrix, 0.0);
        }
    }
}

// Make sure the Random class is defined or included before PoolRoom
// Example simple Random class (if not already defined elsewhere)
class Random {
    constructor(seed) {
        this.seed = seed;
    }
    random() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

// Assume 'textures' is a global object holding the loaded WebGL textures
// e.g., textures = { sky: skyTexture, floor: floorTexture, ... };
// Assume Cube class is defined elsewhere.
// Assume PoolRoom class is defined (likely in poolRoom.js and included in the HTML).