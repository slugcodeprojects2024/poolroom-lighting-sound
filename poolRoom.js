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
        
        // Create specialized skybox textures
        this.createSkyboxTextures();
        
        // Create ground plane and pool water
        this.ground = new Cube(gl);
        this.ground.setPosition(this.mapSize / 2 - 0.5, -0.05, this.mapSize / 2 - 0.5);
        this.ground.setScale(this.mapSize, 0.1, this.mapSize);

        // Create pool water with adjusted position
        this.poolWater = new Cube(gl);
        this.poolWater.setPosition(this.mapSize / 2 - 0.5, -0.1, this.mapSize / 2 - 0.5); // Slightly lower
        this.poolWater.setScale(this.mapSize * 0.7, 0.05, this.mapSize * 0.7);

        // Create pool floor (much deeper)
        const poolSize = this.mapSize * 0.7;
        const poolStart = (this.mapSize - poolSize) / 2;
        this.poolFloor = new Cube(gl);
        this.poolFloor.setPosition(this.mapSize / 2 - 0.5, -1.0, this.mapSize / 2 - 0.5);
        this.poolFloor.setScale(poolSize, 0.1, poolSize);

        // Create pool walls to show depth
        const wallDepth = 1.0; // How deep the pool appears visually

        // Create four walls surrounding the pool
        this.poolWalls = [];

        // North wall
        const northWall = new Cube(gl);
        northWall.setPosition(this.mapSize / 2 - 0.5, -0.5, poolStart);
        northWall.setScale(poolSize, 1.0, 0.1);
        northWall.type = 'poolWall';
        this.poolWalls.push(northWall);

        // South wall
        const southWall = new Cube(gl);
        southWall.setPosition(this.mapSize / 2 - 0.5, -wallDepth/2, poolStart + poolSize);
        southWall.setScale(poolSize, wallDepth, 0.1);
        southWall.type = 'poolWall';
        this.poolWalls.push(southWall);

        // East wall
        const eastWall = new Cube(gl);
        eastWall.setPosition(poolStart, -wallDepth/2, this.mapSize / 2 - 0.5);
        eastWall.setScale(0.1, wallDepth, poolSize);
        eastWall.type = 'poolWall';
        this.poolWalls.push(eastWall);

        // West wall
        const westWall = new Cube(gl);
        westWall.setPosition(poolStart + poolSize, -wallDepth/2, this.mapSize / 2 - 0.5);
        westWall.setScale(0.1, wallDepth, poolSize);
        westWall.type = 'poolWall';
        this.poolWalls.push(westWall);
        
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

    // Make sure your createSkybox method creates these with different Y positions:
    createSkybox() {
        const gl = this.gl;
        
        // Create separate cubes for walls, ceiling, and floor
        this.skyboxWalls = new Cube(gl);
        this.skyboxWalls.setPosition(this.mapSize / 2 - 0.5, 0, this.mapSize / 2 - 0.5);
        this.skyboxWalls.setScale(800, 800, 800);
        
        // Position ceiling slightly higher so its bottom doesn't interfere
        this.skyboxCeiling = new Cube(gl);
        this.skyboxCeiling.setPosition(this.mapSize / 2 - 0.5, 400, this.mapSize / 2 - 0.5);
        this.skyboxCeiling.setScale(800, 0.01, 800); // Make it thin so only top face shows
        
        // Position floor slightly lower and make it clearly separate from the walls
        this.skyboxFloor = new Cube(gl);
        this.skyboxFloor.setPosition(this.mapSize / 2 - 0.5, -401, this.mapSize / 2 - 0.5); // Move it down a bit more
        this.skyboxFloor.setScale(799, 0.01, 799); // Make it slightly smaller to avoid z-fighting

        // Create a dedicated ground plane WAY below everything
        // This will be our "distant floor" that matches the skybox
        this.skyboxGroundPlane = new Cube(gl); 
        this.skyboxGroundPlane.setPosition(this.mapSize / 2 - 0.5, -200, this.mapSize / 2 - 0.5);
        this.skyboxGroundPlane.setScale(2000, 0.1, 2000); // Make it VERY large to cover everything
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
            skyboxCeiling: this.createPlaceholderTexture([135, 206, 250, 255]), // Sky blue for ceiling
            skyboxFloor: this.createPlaceholderTexture([200, 200, 230, 255]),    // Light gray-blue for floor
            skyboxWall: this.createPlaceholderTexture([120, 180, 255, 255]),     // Light blue for walls
            pillar: this.createPlaceholderTexture([220, 220, 220, 255]),    // Light gray for pillars
            poolWall: this.createPlaceholderTexture([120, 180, 255, 255])    // Light blue for pool walls
        };

        // Add textures for different block types
        this.textures.stone = this.createPlaceholderTexture([120, 120, 120, 255]); // Grey for stone
        this.textures.wood = this.createPlaceholderTexture([150, 100, 50, 255]);   // Brown for wood
        this.textures.glass = this.createPlaceholderTexture([200, 230, 255, 180]); // Light blue semi-transparent for glass

        // Load image-based textures with the correct assignment
        this.loadTextureFromFile('textures/end_stone_bricks.png', 'floor');      // End stone bricks for floor
        this.loadTextureFromFile('textures/stone_bricks.png', 'poolBottom');     // Stone bricks for pool bottom
        this.loadTextureFromFile('textures/end_stone_bricks.png', 'wall');       // End stone bricks for walls  
        this.loadTextureFromFile('textures/end_stone_bricks.png', 'ceiling');    // End stone bricks for ceiling
        this.loadTextureFromFile('textures/dark_prismarine.png', 'pillar');      // Dark prismarine for pillars
        this.loadTextureFromFile('textures/stone.jpg', 'stone');          // Stone texture
        this.loadTextureFromFile('textures/wood.jpg', 'wood');             // Wood texture
        this.loadTextureFromFile('textures/glass.jpg', 'glass', {                // Glass texture
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE
        });

        // Load skybox textures: each face gets its own texture
        this.loadTextureFromFile('textures/sky_texture.jpg', 'skyboxCeiling');   // Sky ceiling texture
        this.loadTextureFromFile('textures/skyfloor_texture.jpg', 'skyboxFloor', {
            wrapS: gl.CLAMP_TO_EDGE,  // Add edge clamping
            wrapT: gl.CLAMP_TO_EDGE   // Add edge clamping
        }); // Sky floor texture
        this.loadTextureFromFile('textures/skybox_render.jpg', 'skyboxWall');    // Skybox render for walls

        // Create a water texture (procedural)
        this.createEnhancedWaterTexture();

        // Add pool wall texture loading
        this.loadTexture('poolWall', 'textures/stone_bricks.png');
    }

    // Create specialized skybox textures
    createSkyboxTextures() {
        // We'll use the image-based skybox texture instead of procedural generation
        // The textures.sky will be loaded from loadTextureFromFile in createTextures()
    }

    // Create a sky ceiling texture with clouds
    createSkyCeilingTexture() {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Create a canvas for the sky
        const canvas = document.createElement('canvas');
        canvas.width = 512;  // Larger texture for better quality
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Create a gradient from lighter blue at center to slightly darker at edges
        const gradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, 0,
            canvas.width/2, canvas.height/2, canvas.width/2
        );
        gradient.addColorStop(0, 'rgb(135, 206, 250)');  // Sky blue at center
        gradient.addColorStop(1, 'rgb(100, 180, 255)');  // Slightly darker at edges
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        
        // Helper function to draw a cloud
        function drawCloud(x, y, size) {
            const numBubbles = 5 + Math.floor(Math.random() * 5);
            for (let i = 0; i < numBubbles; i++) {
                const bubbleX = x + (Math.random() * 2 - 1) * size;
                const bubbleY = y + (Math.random() * 2 - 1) * size/2;
                const radius = (0.3 + Math.random() * 0.7) * size;
                
                ctx.beginPath();
                ctx.arc(bubbleX, bubbleY, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw several clouds
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = 20 + Math.random() * 40;
            
            drawCloud(x, y, size);
        }
        
        // Upload to WebGL
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        
        return texture;
    }

    // Create a sky floor texture (distant ground)
    createSkyFloorTexture() {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Create a canvas for the distant ground
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Create a gradient from lighter to darker
        const gradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, 0,
            canvas.width/2, canvas.height/2, canvas.width/2
        );
        gradient.addColorStop(0, 'rgb(230, 230, 255)');  // Light blue-white in center
        gradient.addColorStop(1, 'rgb(200, 200, 230)');  // Slightly darker at edges
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some faint grid lines for perspective
        ctx.strokeStyle = 'rgba(180, 180, 220, 0.3)';
        ctx.lineWidth = 1;
        
        // Draw grid pattern
        const spacing = 20;
        for (let x = 0; x < canvas.width; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Upload to WebGL
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        
        return texture;
    }

    // Create a unified sky texture with gradient and clouds
    createSkyTexture() {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Create a canvas for the sky
        const canvas = document.createElement('canvas');
        canvas.width = 1024;  // Larger texture for better quality
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Create a gradient from blue at the top to lighter blue/white at the horizon
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgb(80, 150, 240)');    // Sky blue at top
        gradient.addColorStop(0.5, 'rgb(120, 180, 255)');  // Mid blue
        gradient.addColorStop(0.8, 'rgb(180, 220, 255)');  // Light blue at horizon
        gradient.addColorStop(1, 'rgb(220, 230, 255)');    // Almost white at bottom
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        
        // Helper function to draw a cloud
        function drawCloud(x, y, size) {
            const numBubbles = 5 + Math.floor(Math.random() * 5);
            for (let i = 0; i < numBubbles; i++) {
                const bubbleX = x + (Math.random() * 2 - 1) * size;
                const bubbleY = y + (Math.random() * 2 - 1) * size/2;
                const radius = (0.3 + Math.random() * 0.7) * size;
                
                ctx.beginPath();
                ctx.arc(bubbleX, bubbleY, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw several clouds concentrated in the upper part of the texture
        for (let i = 0; i < 25; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height * 0.6; // Keep clouds in upper 60% of texture
            const size = 20 + Math.random() * 50;
            
            drawCloud(x, y, size);
        }
        
        // Add distant terrain silhouette near the horizon
        ctx.fillStyle = 'rgba(100, 120, 160, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.85);
        
        // Create a jagged mountain-like silhouette
        for (let x = 0; x < canvas.width; x += canvas.width/20) {
            const height = canvas.height * (0.8 + Math.random() * 0.1);
            ctx.lineTo(x, height);
        }
        ctx.lineTo(canvas.width, canvas.height * 0.85);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();
        
        // Upload to WebGL
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        
        return texture;
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
            ctx.lineTo(canvas.width, x);
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

        // Render with the separate skyboxes
        gl.depthFunc(gl.LEQUAL);

        // 1. First render the walls
        gl.bindTexture(gl.TEXTURE_2D, this.textures.skyboxWall);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 1.0);
        gl.uniform2f(u_TexScale, 1.0, 1.0);
        this.skyboxWalls.render(gl, program, viewMatrix, projectionMatrix, 1.0);

        // 2. Then render the ceiling
        gl.bindTexture(gl.TEXTURE_2D, this.textures.skyboxCeiling);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 1.0);
        gl.uniform2f(u_TexScale, 1.0, 1.0);
        this.skyboxCeiling.render(gl, program, viewMatrix, projectionMatrix, 1.0);
        
        // 3. Render the dedicated ground plane with skyfloor texture
        gl.bindTexture(gl.TEXTURE_2D, this.textures.skyboxFloor);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 1.0);
        gl.uniform2f(u_TexScale, 500.0, 500.0); // Dramatically increase from 1.0 to 500.0 for tiny squares
        this.skyboxGroundPlane.render(gl, program, viewMatrix, projectionMatrix, 1.0);

        gl.depthFunc(gl.LESS);
        
        // 2. Render ground with floor texture
        gl.bindTexture(gl.TEXTURE_2D, this.textures.floor);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 0.95); // Stronger texture influence
        gl.uniform2f(u_TexScale, 64.0, 64.0);   // 8x8 tiling for finer floor detail
        this.ground.render(gl, program, viewMatrix, projectionMatrix, 0.95);
        
        // 3. Render pool floor with stone bricks texture
        gl.bindTexture(gl.TEXTURE_2D, this.textures.poolBottom);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 0.95);
        gl.uniform2f(u_TexScale, 32.0, 32.0);   // 4x4 tiling for pool bottom
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
            else if (cube.type === 'stone') {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.stone);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 1.0);
                gl.uniform2f(u_TexScale, 1.0, 1.0);
            }
            else if (cube.type === 'wood') {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.wood);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 1.0);
                gl.uniform2f(u_TexScale, 1.0, 1.0);
            }
            else if (cube.type === 'glass') {
                // Enable blending for glass blocks
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                
                gl.bindTexture(gl.TEXTURE_2D, this.textures.glass);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 0.7); // Semi-transparent
                gl.uniform1f(u_texColorWeight, 0.8);
                gl.uniform2f(u_TexScale, 1.0, 1.0);
            }
            else {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.wall);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 0.95);
                gl.uniform2f(u_TexScale, 2.0, 2.0);         // 2x2 tiling for walls
            }
            
            // Render the cube with appropriate texture
            cube.render(gl, program, viewMatrix, projectionMatrix, 0.85);

            // After the cube is rendered, if it was glass, disable blending
            if (cube.type === 'glass') {
                gl.disable(gl.BLEND);
            }
        }

        // Render pool walls
        for (const wall of this.poolWalls) {
            gl.bindTexture(gl.TEXTURE_2D, this.textures.poolWall);
            gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
            gl.uniform1f(u_texColorWeight, 0.95);
            gl.uniform2f(u_TexScale, 4.0, 4.0);
            wall.render(gl, program, viewMatrix, projectionMatrix, 0.95);
        }
    }
}
