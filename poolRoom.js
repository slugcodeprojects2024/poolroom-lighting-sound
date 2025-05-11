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
            floor: null,
            skyCeiling: null, // Added for new skybox
            skyFloor: null    // Added for new skybox
        };
        
        // Create texture objects
        this.createTextures();
        
        // Create ground plane and pool water
        this.ground = new Cube(gl);
        this.ground.setPosition(this.mapSize / 2 - 0.5, -0.05, this.mapSize / 2 - 0.5);
        this.ground.setScale(this.mapSize, 0.1, this.mapSize);

        // Create pool water with DEEPER pool
        this.poolWater = new Cube(gl);
        this.poolWater.setPosition(this.mapSize / 2 - 0.5, 0.025, this.mapSize / 2 - 0.5);
        this.poolWater.setScale(this.mapSize * 0.7, 0.05, this.mapSize * 0.7);

        // Create pool floor (much deeper)
        const poolSize = this.mapSize * 0.7;
        const poolStart = (this.mapSize - poolSize) / 2;
        this.poolFloor = new Cube(gl);
        this.poolFloor.setPosition(this.mapSize / 2 - 0.5, -3.0, this.mapSize / 2 - 0.5); // Deeper pool floor
        this.poolFloor.setScale(poolSize, 0.1, poolSize);
        
        // Create skybox components
        this.createSkybox(); // Call the new skybox creation method
        
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
        
        // Create window patterns - based on your first image
        // Tall vertical windows on the left side
        for (let z = 6; z < this.mapSize - 6; z += 8) {
            for (let y = 0; y < this.maxHeight - 1; y++) {
                // Create tall window openings
                this.map[0][z] = 0; // Complete opening in wall
                this.map[0][z+1] = 0; // Make window 2 units wide
            }
        }
        
        // Windows on other walls
        for (let x = 8; x < this.mapSize - 8; x += 8) {
            this.map[x][0] = 0;
            this.map[x+1][0] = 0;
            
            this.map[x][this.mapSize-1] = 0;
            this.map[x+1][this.mapSize-1] = 0;
            
            this.map[this.mapSize-1][x] = 0;
            this.map[this.mapSize-1][x+1] = 0;
        }
        
        // Large central pool
        // Based on your first image, the pool is a large, somewhat irregular shape
        for (let x = 4; x < this.mapSize - 4; x++) {
            for (let z = this.mapSize/2; z < this.mapSize - 4; z++) {
                // Create walkway around the edge of the pool
                if (x > 6 && x < this.mapSize - 6 && z > this.mapSize/2 + 2) {
                    // This area will be the pool - don't put walls here
                    // We'll render the water separately
                } else {
                    // Floor level walls/walkways
                    if (this.map[x][z] === 0) this.map[x][z] = 1;
                }
            }
        }
        
        // Add some structural columns/pillars
        for (let x = 8; x < this.mapSize - 8; x += 8) {
            for (let z = 8; z < this.mapSize - 8; z += 8) {
                this.map[x][z] = this.maxHeight;
            }
        }
    }

    // Create individual skybox planes
    createSkybox() {
        const gl = this.gl;
        
        // Keep the existing skybox cube for the ceiling and floor
        this.skybox = new Cube(gl);
        this.skybox.setPosition(0, 0, 0);
        this.skybox.setScale(400, 400, 400);
        this.skybox.isOriginalSkybox = true;
        
        // Add four walls with the skybox image texture
        this.skyboxWalls = [];
        
        // Distance for positioning walls
        const distance = 100;
        const height = 300; // Match the cube height
        const width = 300;  // Match the cube width
        
        // Create north wall (front)
        const northWall = new Cube(gl);
        northWall.setPosition(this.mapSize/2 - 0.5, 0, -distance);
        northWall.setScale(width, height, 0.1);
        northWall.isWall = true;
        this.skyboxWalls.push(northWall);
        
        // Create south wall (back)
        const southWall = new Cube(gl);
        southWall.setPosition(this.mapSize/2 - 0.5, 0, this.mapSize + distance);
        southWall.setScale(width, height, 0.1);
        southWall.isWall = true;
        this.skyboxWalls.push(southWall);
        
        // Create east wall (right)
        const eastWall = new Cube(gl);
        eastWall.setPosition(this.mapSize + distance, 0, this.mapSize/2 - 0.5);
        eastWall.setScale(0.1, height, width);
        eastWall.isWall = true;
        this.skyboxWalls.push(eastWall);
        
        // Create west wall (left)
        const westWall = new Cube(gl);
        westWall.setPosition(-distance, 0, this.mapSize/2 - 0.5);
        westWall.setScale(0.1, height, width);
        westWall.isWall = true;
        this.skyboxWalls.push(westWall);
    }
    
    // Create textures programmatically
    createTextures() {
        const gl = this.gl;
        
        // Keep existing wall and floor texture code
        // Wall texture
        this.textures.wall = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.textures.wall);
        
        const wallPixels = new Uint8Array([
            255, 255, 255, 255,
            250, 250, 250, 255,
            250, 250, 250, 255,
            255, 255, 255, 255
        ]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, wallPixels);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        // Floor texture
        this.textures.floor = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.textures.floor);
        
        const floorPixels = new Uint8Array([
            255, 255, 255, 255, 240, 240, 240, 255, 255, 255, 255, 255, 240, 240, 240, 255,
            240, 240, 240, 255, 255, 255, 255, 255, 240, 240, 240, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 240, 240, 240, 255, 255, 255, 255, 255, 240, 240, 240, 255,
            240, 240, 240, 255, 255, 255, 255, 255, 240, 240, 240, 255, 255, 255, 255, 255
        ]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, floorPixels);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        
        // Add texture for skybox ceiling (sky blue)
        this.textures.skyCeiling = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.textures.skyCeiling);
        
        const skyBluePixels = new Uint8Array([
            100, 170, 225, 255, 100, 170, 225, 255,
            100, 170, 225, 255, 100, 170, 225, 255
        ]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, skyBluePixels);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        
        // Add texture for skybox floor (off-white)
        this.textures.skyFloor = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.textures.skyFloor);
        
        const offWhitePixels = new Uint8Array([
            240, 238, 230, 255, 240, 238, 230, 255,
            240, 238, 230, 255, 240, 238, 230, 255
        ]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, offWhitePixels);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        
        // Sky texture for walls
        this.textures.sky = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.textures.sky);
        
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([100, 170, 225, 255]) // Sky blue matching your image
        );
        
        const skyImage = new Image();
        skyImage.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this.textures.sky);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // Flip the image vertically
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, skyImage);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); // Reset to default
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            console.log("Sky texture loaded successfully");
        };
        skyImage.onerror = () => {
            console.error("Failed to load sky texture");
        };
        skyImage.src = 'textures/skybox_render.jpg';
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
        
        // Set baseColor uniform for objects
        const u_baseColor = gl.getUniformLocation(program, 'u_baseColor');
        const u_texColorWeight = gl.getUniformLocation(program, 'u_texColorWeight');
        const u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
        
        gl.uniform1i(u_Sampler, 0); // Tell shader to use texture unit 0 for the sampler

        // 1. First render the skybox background (ceiling and floor only)
        gl.depthFunc(gl.LEQUAL);
        
        // For original skybox cube (ceiling and floor only)
        // Use the sky ceiling texture for the top
        // NOTE: A single cube cannot easily have different textures on different faces
        // without more complex shader logic or multiple draw calls with culling.
        // This approach will texture the whole cube with skyCeiling, then skyFloor.
        // For distinct top/bottom, you'd need separate planes or a cubemap.

        // Render skybox ceiling (using the whole skybox cube for now)
        gl.bindTexture(gl.TEXTURE_2D, this.textures.skyCeiling);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 1.0);
        // This will render the entire skybox cube with the ceiling texture.
        // If you want a distinct floor, you'd need another object or a more complex setup.
        this.skybox.render(gl, program, viewMatrix, projectionMatrix, 1.0); 
        
        // 2. Render the four skybox walls using the sky image texture
        gl.bindTexture(gl.TEXTURE_2D, this.textures.sky);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 1.0);
        
        for (const wall of this.skyboxWalls) {
            wall.render(gl, program, viewMatrix, projectionMatrix, 1.0);
        }
        
        gl.depthFunc(gl.LESS);
        
        // 3. Render ground with floor texture
        gl.bindTexture(gl.TEXTURE_2D, this.textures.floor || this.textures.wall);
        gl.uniform4f(u_baseColor, 0.95, 0.95, 0.95, 1.0); // Off-white
        gl.uniform1f(u_texColorWeight, 0.3); // Subtle texture
        this.ground.render(gl, program, viewMatrix, projectionMatrix, 0.3);
        
        // 4. Render pool water (with transparency)
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform4f(u_baseColor, 0.0, 0.7, 0.95, 0.8); // Bright blue, semi-transparent
        gl.uniform1f(u_texColorWeight, 0.0); // No texture, just color
        this.poolWater.render(gl, program, viewMatrix, projectionMatrix, 0.0);
        gl.disable(gl.BLEND);
        
        // 5. Render all walls and ceiling cubes
        gl.bindTexture(gl.TEXTURE_2D, this.textures.wall);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0); // Pure white
        gl.uniform1f(u_texColorWeight, 0.2); // Subtle texture
        
        for (const cube of this.cubes) {
            cube.render(gl, program, viewMatrix, projectionMatrix, 0.2);
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