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
        this.textures = {};
        
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
        
        // Initialize texture objects with procedural placeholders
        this.textures = {
            wall: this.createPlaceholderTexture([40, 100, 180, 255]),     // Dark blue for walls
            floor: this.createPlaceholderTexture([240, 240, 240, 255]),    // Light gray for floor
            ceiling: this.createPlaceholderTexture([40, 100, 180, 255]),   // Dark blue for ceiling
            water: this.createPlaceholderTexture([100, 180, 255, 200]),    // Light blue transparent for water
            poolBottom: this.createPlaceholderTexture([240, 240, 240, 255]), // Light gray for pool bottom
            sky: this.createPlaceholderTexture([135, 206, 235, 255]),      // Sky blue
            pillar: this.createPlaceholderTexture([220, 220, 220, 255])    // Light gray for pillars
        };
        
        // Load image-based textures with the correct assignment
        this.loadTextureFromFile('textures/end_stone_bricks.png', 'floor');      // End stone bricks for floor
        this.loadTextureFromFile('textures/stone_bricks.png', 'poolBottom');     // Stone bricks for pool bottom
        this.loadTextureFromFile('textures/end_stone_bricks.png', 'wall');       // End stone bricks for walls  
        this.loadTextureFromFile('textures/end_stone_bricks.png', 'ceiling');    // End stone bricks for ceiling
        this.loadTextureFromFile('textures/dark_prismarine.png', 'pillar');      // Dark prismarine for pillars
        this.loadTextureFromFile('textures/skybox_render.jpg', 'sky');           // Skybox image
        
        // Create a water texture (procedural)
        this.createEnhancedWaterTexture();
    }

    // Create a placeholder texture with a specific color
    createPlaceholderTexture(color) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Create a 2x2 texture with the specified color
        const pixels = new Uint8Array([
            color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3]
        ]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        
        return texture;
    }

    // Load texture from file with optimization options
    loadTextureFromFile(url, textureKey, options = {}) {
        const gl = this.gl;
        const image = new Image();
        
        // Default options
        const settings = {
            minFilter: gl.LINEAR_MIPMAP_LINEAR,  // Default: smooth scaling with mipmaps
            magFilter: gl.LINEAR,                // Default: smooth rendering up close
            wrapS: gl.REPEAT,                    // Default: repeat texture horizontally
            wrapT: gl.REPEAT,                    // Default: repeat texture vertically
            pixelated: false,                    // Set true for Minecraft-style pixelated look
            ...options
        };
        
        // If pixelated style is requested, change filters
        if (settings.pixelated) {
            settings.minFilter = gl.NEAREST_MIPMAP_LINEAR;
            settings.magFilter = gl.NEAREST;
        }
        
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this.textures[textureKey]);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            
            // Check if power of 2 image for mipmapping
            const isPowerOf2 = (value) => (value & (value - 1)) === 0;
            
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, settings.minFilter);
                
                // Try to enable anisotropic filtering if available (for better texture quality at angles)
                const ext = gl.getExtension('EXT_texture_filter_anisotropic');
                if (ext) {
                    const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
                    gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, max));
                    console.log(`Anisotropic filtering enabled for ${textureKey} (${Math.min(4, max)}x)`);
                }
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                console.warn(`Texture ${textureKey} is not power-of-2 sized. Mipmaps disabled.`);
            }
            
            // Apply texture parameters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, settings.magFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, settings.wrapS);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, settings.wrapT);
            
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            console.log(`Texture ${textureKey} loaded successfully from: ${url}, dimensions: ${image.width}x${image.height}`);
            
            // If this is the skybox or pillar texture, log additional info
            if (textureKey === 'sky' || textureKey === 'pillar') {
                console.log(`Special texture ${textureKey} bound to texture object ${this.textures[textureKey]}`);
            }
        };
        
        image.onerror = () => {
            console.error(`Failed to load texture from: ${url}`);
            // Provide a visible error texture
            this.textures[textureKey] = this.createErrorTexture();
        };
        
        image.src = url;
    }

    // Create an enhanced water texture with more visual interest
    createEnhancedWaterTexture() {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Create a larger canvas for more detailed water
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Fill with base water color gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'rgba(0, 120, 200, 0.7)');   // Darker blue
        gradient.addColorStop(0.3, 'rgba(10, 140, 220, 0.7)'); // Mid blue
        gradient.addColorStop(0.7, 'rgba(20, 160, 240, 0.7)'); // Lighter blue
        gradient.addColorStop(1, 'rgba(0, 120, 200, 0.7)');   // Back to darker blue
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add a subtle grid pattern (Minecraft-like water)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let y = 0; y < canvas.height; y += 16) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Vertical grid lines
        for (let x = 0; x < canvas.width; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Add wave patterns
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 18 + 5);
            
            // Create wavy line with varying amplitude
            for (let x = 0; x < canvas.width; x += 10) {
                const y = i * 18 + 5 + Math.sin(x / 20 + i) * 6;
                ctx.lineTo(x, y);
            }
            
            ctx.stroke();
        }
        
        // Add some brighter highlights
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = 5 + Math.random() * 15;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Upload to WebGL with proper parameters
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        
        this.textures.water = texture;
        return texture;
    }
    
    // Build the 3D world based on the map
    buildWorld() {
        const gl = this.gl;
        
        // Create ceiling at max height
        for (let x = 1; x < this.mapSize - 1; x++) {
            for (let z = 1; z < this.mapSize - 1; z++) {
                const ceiling = new Cube(gl);
                ceiling.setPosition(x, this.maxHeight + 0.5, z);
                ceiling.type = 'ceiling'; // Tag as ceiling for texture selection
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
                        
                        // Tag cube with its type for texture selection
                        if (cube.modelMatrix.elements[13] > 0) { // If y > 0 (not floor level)
                            // Check if this is a pillar location
                            if ((x % 8 === 0 || x % 8 === 1) && 
                                (z % 8 === 0 || z % 8 === 1) && 
                                x > 0 && x < this.mapSize-2 && 
                                z > 0 && z < this.mapSize-2) {
                                cube.type = 'pillar'; // Tag as pillar
                            } else {
                                cube.type = 'wall'; // Tag as wall
                            }
                        } else {
                            cube.type = 'floor'; // Ground level is floor
                        }
                        
                        this.cubes.push(cube);
                    }
                }
            }
        }
        
        // Create pool floor with special texture
        const poolFloor = new Cube(gl);
        poolFloor.setPosition(this.mapSize / 2 - 0.5, -1.05, this.mapSize / 2 - 0.5);
        poolFloor.setScale(this.mapSize * 0.7, 0.1, this.mapSize * 0.7);
        poolFloor.type = 'poolBottom';
        this.poolFloor = poolFloor;
    }
    
    // Render the entire poolroom
    render(gl, program, camera) {
        const viewMatrix = camera.viewMatrix;
        const projectionMatrix = camera.projectionMatrix;
        
        // Set shader uniforms
        const u_baseColor = gl.getUniformLocation(program, 'u_baseColor');
        const u_texColorWeight = gl.getUniformLocation(program, 'u_texColorWeight');
        const u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
        const u_TexScale = gl.getUniformLocation(program, 'u_TexScale'); // Added uniform for texture scaling
        
        gl.uniform1i(u_Sampler, 0); // Use texture unit 0

        // 1. First render the skybox background
        gl.depthFunc(gl.LEQUAL);

        // Ensure skybox texture is bound and using correct parameters
        gl.bindTexture(gl.TEXTURE_2D, this.textures.sky);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);  // Pure white to show true texture colors
        gl.uniform1f(u_texColorWeight, 1.0);            // Full texture influence
        gl.uniform2f(u_TexScale, 1.0, 1.0);             // No tiling for skybox

        // Render skybox
        this.skybox.render(gl, program, viewMatrix, projectionMatrix, 1.0);

        // Render skybox walls
        for (const wall of this.skyboxWalls) {
            wall.render(gl, program, viewMatrix, projectionMatrix, 1.0);
        }

        gl.depthFunc(gl.LESS);
        
        // 2. Render ground with floor texture
        gl.bindTexture(gl.TEXTURE_2D, this.textures.floor);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 0.95); // Stronger texture influence
        gl.uniform2f(u_TexScale, 8.0, 8.0);   // 8x8 tiling for finer floor detail
        this.ground.render(gl, program, viewMatrix, projectionMatrix, 0.95);
        
        // 3. Render pool floor with stone bricks texture
        gl.bindTexture(gl.TEXTURE_2D, this.textures.poolBottom);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 0.95);
        gl.uniform2f(u_TexScale, 4.0, 4.0);   // 4x4 tiling for pool bottom
        this.poolFloor.render(gl, program, viewMatrix, projectionMatrix, 0.95);
        
        // 4. Render pool water (with transparency)
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.bindTexture(gl.TEXTURE_2D, this.textures.water);
        gl.uniform4f(u_baseColor, 0.0, 0.7, 0.95, 0.7);  // Bright blue with transparency
        gl.uniform1f(u_texColorWeight, 0.7);             // Increased texture influence
        gl.uniform2f(u_TexScale, 2.0, 2.0);              // 2x2 tiling for more visible water pattern
        this.poolWater.render(gl, program, viewMatrix, projectionMatrix, 0.7);
        gl.disable(gl.BLEND);
        
        // 5. Render all walls, ceiling, and other cubes
        for (const cube of this.cubes) {
            // Select texture based on cube type
            if (cube.type === 'ceiling') {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.ceiling);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 0.95);
                gl.uniform2f(u_TexScale, 2.0, 2.0);         // 2x2 tiling for ceiling
            }
            else if (cube.type === 'floor') {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.floor);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 0.95);
                gl.uniform2f(u_TexScale, 8.0, 8.0);         // 8x8 tiling consistent with ground
            }
            else if (cube.type === 'pillar') {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.pillar);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0); // Ensure base color is white
                gl.uniform1f(u_texColorWeight, 1.0);          // Increase texture influence to 100%
                gl.uniform2f(u_TexScale, 1.0, 1.0);           // 1x1 tiling to see full texture
            }
            else {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.wall);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 0.95);
                gl.uniform2f(u_TexScale, 2.0, 2.0);         // 2x2 tiling for walls
            }
            
            // Render the cube with appropriate texture
            cube.render(gl, program, viewMatrix, projectionMatrix, 0.85);
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