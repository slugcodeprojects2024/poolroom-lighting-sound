// poolRoom.js - Implementation of poolroom layout and rendering
class PoolRoom {
    constructor(gl) {
        this.gl = gl;
        this.mapSize = 32;
        this.maxHeight = 4;
        this.map = [];
        this.cubes = [];
        
        // Initialize the map
        for (let x = 0; x < this.mapSize; x++) {
            this.map[x] = [];
            for (let z = 0; z < this.mapSize; z++) {
                this.map[x][z] = 0;
            }
        }
        
        // Create poolroom layout
        this.createLayout();
        
        // Initialize textures
        this.textures = {
            sky: null,
            wall: null,
            floor: null
        };
        
        // Create texture objects
        this.createTextures();
        
        // Create ground plane, pool water, and skybox
        this.ground = new Cube(gl);
        this.ground.setPosition(this.mapSize/2 - 0.5, -0.05, this.mapSize/2 - 0.5);
        this.ground.setScale(this.mapSize, 0.1, this.mapSize);
        
        this.poolWater = new Cube(gl);
        this.poolWater.setPosition(this.mapSize/2 - 0.5, 0.025, this.mapSize/2 - 0.5);
        this.poolWater.setScale(this.mapSize * 0.7, 0.05, this.mapSize * 0.7);
        
        this.skybox = new Cube(gl);
        this.skybox.setPosition(0, 0, 0);
        this.skybox.setScale(500, 500, 500);
        
        // Build the world objects
        this.buildWorld();
    }
    
    // Create the poolroom layout
    createLayout() {
        // Create outer walls
        for (let x = 0; x < this.mapSize; x++) {
            for (let z = 0; z < this.mapSize; z++) {
                // Create walls around the perimeter
                if (x === 0 || x === this.mapSize - 1 || z === 0 || z === this.mapSize - 1) {
                    this.map[x][z] = this.maxHeight; // Full height walls
                }
            }
        }
        
        // Add columns in the room
        for (let x = 4; x < this.mapSize - 4; x += 6) {
            for (let z = 4; z < this.mapSize - 4; z += 6) {
                this.map[x][z] = this.maxHeight; // Full height columns
            }
        }
        
        // Create window patterns in the outer walls
        for (let x = 4; x < this.mapSize - 4; x += 3) {
            // Windows on north and south walls
            this.map[x][0] = 0; // Window (no wall)
            this.map[x][1] = 1; // Window ledge
            
            this.map[x][this.mapSize-1] = 0; // Window (no wall)
            this.map[x][this.mapSize-2] = 1; // Window ledge
        }
        
        for (let z = 4; z < this.mapSize - 4; z += 3) {
            // Windows on east and west walls
            this.map[0][z] = 0; // Window (no wall)
            this.map[1][z] = 1; // Window ledge
            
            this.map[this.mapSize-1][z] = 0; // Window (no wall)
            this.map[this.mapSize-2][z] = 1; // Window ledge
        }
        
        // Create entrances/exits
        this.map[this.mapSize/2][0] = 0; // North entrance
        this.map[this.mapSize/2][1] = 0;
        
        this.map[this.mapSize/2][this.mapSize-1] = 0; // South entrance
        this.map[this.mapSize/2][this.mapSize-2] = 0;
        
        this.map[0][this.mapSize/2] = 0; // West entrance
        this.map[1][this.mapSize/2] = 0;
        
        this.map[this.mapSize-1][this.mapSize/2] = 0; // East entrance
        this.map[this.mapSize-2][this.mapSize/2] = 0;
    }
    
    // Create textures programmatically
    createTextures() {
        const gl = this.gl;
        
        // 1. Create wall texture (white)
        this.textures.wall = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.textures.wall);
        
        // Create a 2x2 white texture
        const wallPixels = new Uint8Array([
            255, 255, 255, 255,
            250, 250, 250, 255,
            250, 250, 250, 255,
            255, 255, 255, 255
        ]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, wallPixels);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        // 2. Create floor texture (white with grid)
        this.textures.floor = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.textures.floor);
        
        // Create a 4x4 grid texture
        const floorPixels = new Uint8Array([
            255, 255, 255, 255, 240, 240, 240, 255, 255, 255, 255, 255, 240, 240, 240, 255,
            240, 240, 240, 255, 255, 255, 255, 255, 240, 240, 240, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 240, 240, 240, 255, 255, 255, 255, 255, 240, 240, 240, 255,
            240, 240, 240, 255, 255, 255, 255, 255, 240, 240, 240, 255, 255, 255, 255, 255
        ]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, floorPixels);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        
        // 3. Load sky texture from file
        this.textures.sky = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.textures.sky);
        
        // Initially fill with a blue color until image loads
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([135, 206, 235, 255]) // Sky blue
        );
        
        // Load the actual image
        const skyImage = new Image();
        skyImage.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this.textures.sky);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, skyImage);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        };
        skyImage.src = 'textures/sky.png';
    }
    
    // Build the 3D world based on the map
    buildWorld() {
        const gl = this.gl;
        
        // Create ceiling at max height
        for (let x = 1; x < this.mapSize - 1; x++) {
            for (let z = 1; z < this.mapSize - 1; z++) {
                const ceiling = new Cube(gl);
                ceiling.setPosition(x, this.maxHeight + 0.5, z);
                this.cubes.push(ceiling);
            }
        }
        
        // Create walls based on the map
        for (let x = 0; x < this.mapSize; x++) {
            for (let z = 0; z < this.mapSize; z++) {
                const height = this.map[x][z];
                if (height > 0) {
                    for (let y = 0; y < height; y++) {
                        const cube = new Cube(gl);
                        cube.setPosition(x, y + 0.5, z);
                        this.cubes.push(cube);
                    }
                }
            }
        }
    }
    
    // Render the entire poolroom
    render(gl, program, camera) {
        const viewMatrix = camera.viewMatrix;
        const projectionMatrix = camera.projectionMatrix;
        
        // Set baseColor uniform for blue water
        const u_baseColor = gl.getUniformLocation(program, 'u_baseColor');
        
        // 1. Render skybox with sky texture
        gl.depthFunc(gl.LEQUAL);
        gl.bindTexture(gl.TEXTURE_2D, this.textures.sky);
        gl.uniform4f(u_baseColor, 0.7, 0.85, 1.0, 1.0); // Light blue
        this.skybox.render(gl, program, viewMatrix, projectionMatrix, 1.0); // Full texture
        gl.depthFunc(gl.LESS);
        
        // 2. Render ground with floor texture
        gl.bindTexture(gl.TEXTURE_2D, this.textures.floor);
        gl.uniform4f(u_baseColor, 0.95, 0.95, 0.95, 1.0); // Off-white
        this.ground.render(gl, program, viewMatrix, projectionMatrix, 1.0);
        
        // 3. Render pool water (with transparency)
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform4f(u_baseColor, 0.0, 0.7, 0.95, 0.8); // Bright blue, semi-transparent
        this.poolWater.render(gl, program, viewMatrix, projectionMatrix, 0.0); // No texture, just color
        gl.disable(gl.BLEND);
        
        // 4. Render all walls and ceiling cubes
        gl.bindTexture(gl.TEXTURE_2D, this.textures.wall);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0); // Pure white
        for (const cube of this.cubes) {
            cube.render(gl, program, viewMatrix, projectionMatrix, 0.8); // Slight texture
        }
    }
    
    // Add a block at a position
    addBlock(x, y, z) {
        // Validate coordinates
        if (x < 0 || x >= this.mapSize || z < 0 || z >= this.mapSize || y < 0 || y >= this.maxHeight) {
            return false;
        }
        
        // Update map
        this.map[x][z] = Math.max(this.map[x][z], y + 1);
        
        // Create a new cube
        const cube = new Cube(this.gl);
        cube.setPosition(x, y + 0.5, z);
        this.cubes.push(cube);
        
        return true;
    }
    
    // Remove a block at a position
    removeBlock(x, y, z) {
        // Find the cube at this position
        for (let i = 0; i < this.cubes.length; i++) {
            const cube = this.cubes[i];
            const matrix = cube.modelMatrix.elements;
            
            // Check position (matrix[12], matrix[13], matrix[14] are the translation components)
            if (Math.abs(matrix[12] - x) < 0.1 && 
                Math.abs(matrix[13] - (y + 0.5)) < 0.1 && 
                Math.abs(matrix[14] - z) < 0.1) {
                
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
}