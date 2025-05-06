class World {
    constructor(gl) {
        this.gl = gl;
        this.cubes = []; // All cubes in the world
        this.map = [];   // 2D array representing the world
        
        // Initialize an empty 32x32 map
        this.mapSize = 32;
        this.maxHeight = 4;
        
        for (let x = 0; x < this.mapSize; x++) {
            this.map[x] = [];
            for (let z = 0; z < this.mapSize; z++) {
                this.map[x][z] = 0; // Default: no walls
            }
        }
        
        // Create poolrooms layout - large interior spaces with pools
        this.createPoolroomsLayout();
        
        // Create the ground
        this.ground = new Cube(gl);
        this.ground.scale(this.mapSize, 0.1, this.mapSize);
        this.ground.translate(this.mapSize/2 - 0.5, -0.05, this.mapSize/2 - 0.5);
        this.ground.setColor(0.98, 0.98, 0.98); // Almost pure white
        this.ground.enableTexture(1); // Ground texture index - white tile texture
        
        // Create pool water - large central pool
        this.poolWater = new Cube(gl);
        // Center pool covering most of the floor
        this.poolWater.scale(this.mapSize * 0.7, 0.05, this.mapSize * 0.7);
        this.poolWater.translate(this.mapSize/2 - 0.5, 0.025, this.mapSize/2 - 0.5);
        this.poolWater.setColor(0.0, 0.7, 0.95, 0.8); // Bright blue, semi-transparent
        
        // Create ceiling lights - bright squares
        this.lights = [];
        for (let x = 4; x < this.mapSize - 4; x += 4) {
            for (let z = 4; z < this.mapSize - 4; z += 4) {
                const light = new Cube(gl);
                light.scale(1.5, 0.05, 1.5);
                light.translate(x, this.maxHeight - 0.1, z);
                light.setColor(1.0, 1.0, 0.9); // Slightly warm white
                this.lights.push(light);
            }
        }
        
        // Create skybox
        this.skybox = new Cube(gl);
        this.skybox.scale(500, 500, 500);
        this.skybox.setColor(0.7, 0.85, 1.0); // Light blue
        this.skybox.enableTexture(0); // Sky texture index
        
        // Build the world based on the map
        this.buildWorld();
    }
    
    // Create a poolrooms-style layout
    createPoolroomsLayout() {
        // Create outer walls - full height
        for (let x = 0; x < this.mapSize; x++) {
            for (let z = 0; z < this.mapSize; z++) {
                if (x === 0 || x === this.mapSize - 1 || z === 0 || z === this.mapSize - 1) {
                    this.map[x][z] = this.maxHeight; // Full height outer walls
                }
            }
        }
        
        // Create a large central room with columns
        const roomStartX = 3;
        const roomEndX = this.mapSize - 4;
        const roomStartZ = 3;
        const roomEndZ = this.mapSize - 4;
        
        // Add columns/pillars in the central room
        for (let x = roomStartX + 4; x < roomEndX; x += 6) {
            for (let z = roomStartZ + 4; z < roomEndZ; z += 6) {
                this.map[x][z] = this.maxHeight; // Full height columns
            }
        }
        
        // Create window patterns in the outer walls
        for (let x = 4; x < this.mapSize - 4; x += 3) {
            // Windows on north and south walls
            this.map[x][0] = 0; // Window (no wall) at bottom
            this.map[x][1] = 1; // Window ledge
            this.map[x][2] = this.maxHeight; // Wall above window
            
            this.map[x][this.mapSize-1] = 0; // Window (no wall) at bottom
            this.map[x][this.mapSize-2] = 1; // Window ledge
            this.map[x][this.mapSize-3] = this.maxHeight; // Wall above window
        }
        
        for (let z = 4; z < this.mapSize - 4; z += 3) {
            // Windows on east and west walls
            this.map[0][z] = 0; // Window (no wall) at bottom
            this.map[1][z] = 1; // Window ledge
            this.map[2][z] = this.maxHeight; // Wall above window
            
            this.map[this.mapSize-1][z] = 0; // Window (no wall) at bottom
            this.map[this.mapSize-2][z] = 1; // Window ledge
            this.map[this.mapSize-3][z] = this.maxHeight; // Wall above window
        }
        
        // Add a second floor balcony/ledge around the perimeter
        for (let x = 3; x < this.mapSize - 3; x++) {
            // North and south balconies
            if (this.map[x][3] === 0) this.map[x][3] = 1; // Floor level
            if (this.map[x][this.mapSize-4] === 0) this.map[x][this.mapSize-4] = 1; // Floor level
        }
        
        for (let z = 3; z < this.mapSize - 3; z++) {
            // East and west balconies
            if (this.map[3][z] === 0) this.map[3][z] = 1; // Floor level
            if (this.map[this.mapSize-4][z] === 0) this.map[this.mapSize-4][z] = 1; // Floor level
        }
        
        // Create entrances/exits
        this.map[this.mapSize/2][0] = 0; // North entrance
        this.map[this.mapSize/2][1] = 0;
        this.map[this.mapSize/2][2] = 0;
        
        this.map[this.mapSize/2][this.mapSize-1] = 0; // South entrance
        this.map[this.mapSize/2][this.mapSize-2] = 0;
        this.map[this.mapSize/2][this.mapSize-3] = 0;
        
        this.map[0][this.mapSize/2] = 0; // West entrance
        this.map[1][this.mapSize/2] = 0;
        this.map[2][this.mapSize/2] = 0;
        
        this.map[this.mapSize-1][this.mapSize/2] = 0; // East entrance
        this.map[this.mapSize-2][this.mapSize/2] = 0;
        this.map[this.mapSize-3][this.mapSize/2] = 0;
    }
    
    // Build the world based on the map
    buildWorld() {
        // Create ceiling first (large flat surface)
        for (let x = 1; x < this.mapSize - 1; x++) {
            for (let z = 1; z < this.mapSize - 1; z++) {
                const ceiling = new Cube(this.gl);
                ceiling.translate(x, this.maxHeight + 0.5, z);
                ceiling.enableTexture(1); // Ceiling texture (tiles)
                ceiling.setColor(0.95, 0.95, 0.95); // Slightly off-white
                this.cubes.push(ceiling);
            }
        }
        
        // Create walls
        for (let x = 0; x < this.mapSize; x++) {
            for (let z = 0; z < this.mapSize; z++) {
                const height = this.map[x][z];
                if (height > 0) {
                    // Create wall cubes stacked to the specified height
                    for (let y = 0; y < height; y++) {
                        const cube = new Cube(this.gl);
                        cube.translate(x, y + 0.5, z); // +0.5 because cube is centered at origin
                        
                        // Set color to bright white
                        cube.setColor(1.0, 1.0, 1.0);
                        
                        // Apply different textures for walls
                        if (y === 0) {
                            // Floor level walls get tile texture
                            cube.enableTexture(1);
                        } else {
                            // Upper walls get wall texture
                            cube.enableTexture(2); 
                        }
                        
                        this.cubes.push(cube);
                    }
                }
            }
        }
        
        // Create the floor walkway around the pool
        for (let x = 2; x < this.mapSize - 2; x++) {
            for (let z = 2; z < this.mapSize - 2; z++) {
                // Skip the central pool area
                if (x >= 5 && x <= this.mapSize - 6 && 
                    z >= 5 && z <= this.mapSize - 6) {
                    continue;
                }
                
                const floor = new Cube(this.gl);
                floor.scale(1, 0.1, 1);
                floor.translate(x, 0.05, z);
                floor.enableTexture(1); // Floor tiles texture
                floor.setColor(0.95, 0.95, 0.95);
                this.cubes.push(floor);
            }
        }
    }
    
    // Add a block at the specified position
    addBlock(x, y, z) {
        // Ensure coordinates are within bounds
        if (x < 0 || x >= this.mapSize || z < 0 || z >= this.mapSize || 
            y < 0 || y >= this.maxHeight) {
            return false;
        }
        
        // Update the map height
        this.map[x][z] = Math.max(this.map[x][z], y + 1);
        
        // Create a new cube at this position
        const cube = new Cube(this.gl);
        cube.translate(x, y + 0.5, z);
        cube.setColor(1.0, 1.0, 1.0); // Pure white
        cube.enableTexture(2); // Wall texture
        this.cubes.push(cube);
        
        return true;
    }
    
    // Remove a block at the specified position
    removeBlock(x, y, z) {
        // Find cubes at this position
        for (let i = this.cubes.length - 1; i >= 0; i--) {
            // Check if the cube is at this position (approximately)
            const cube = this.cubes[i];
            const matrix = cube.modelMatrix.elements;
            const cubeX = matrix[12];
            const cubeY = matrix[13] - 0.5; // Adjust for translation
            const cubeZ = matrix[14];
            
            if (Math.abs(cubeX - x) < 0.1 && 
                Math.abs(cubeY - y) < 0.1 && 
                Math.abs(cubeZ - z) < 0.1) {
                
                // Remove the cube
                this.cubes.splice(i, 1);
                
                // Update the map
                if (this.map[x][z] > y) {
                    this.map[x][z] = y;
                }
                
                return true;
            }
        }
        
        return false;
    }
    
    // Draw the world
    draw(program, camera) {
        // Set up the vertex buffers
        this.ground.setUpVBO();
        this.ground.setupAttributePointers(program);
        this.ground.draw(program, camera);
        
        // Draw the pool water (with transparency)
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.poolWater.setUpVBO();
        this.poolWater.setupAttributePointers(program);
        this.poolWater.draw(program, camera);
        this.gl.disable(this.gl.BLEND);
        
        // Draw ceiling lights
        for (const light of this.lights) {
            light.setUpVBO();
            light.setupAttributePointers(program);
            light.draw(program, camera);
        }
        
        // Draw all cubes
        for (const cube of this.cubes) {
            cube.setUpVBO();
            cube.setupAttributePointers(program);
            cube.draw(program, camera);
        }
        
        // Draw the skybox last
        this.gl.depthFunc(this.gl.LEQUAL);
        this.skybox.setUpVBO();
        this.skybox.setupAttributePointers(program);
        this.skybox.draw(program, camera);
        this.gl.depthFunc(this.gl.LESS);
    }
}