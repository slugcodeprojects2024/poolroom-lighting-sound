// poolRoom.js - Fixed version with proper geometry alignment
class PoolRoom {
    constructor(gl) {
        this.gl = gl;
        this.mapSize = 32;
        this.maxHeight = 4;
        this.map = [];
        this.cubes = [];
        
        // Define poolSize as a class property
        this.poolSize = this.mapSize * 0.7;
        
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
        this.createEnhancedWaterTexture();  // Create water texture first
        this.createTextures();              // Then create other textures
        
        // Create ground sections around the pool with proper positioning
        this.groundSections = [];
        const poolStart = (this.mapSize - this.poolSize) / 2;
        
        // FIXED: Ensure ground sections are properly positioned at y=0
        // North section (above pool)
        const northGround = new Cube(gl);
        northGround.setPosition(this.mapSize / 2 - 0.5, 0, poolStart / 2 - 0.5);
        northGround.setScale(this.mapSize, 0.1, poolStart);
        this.groundSections.push(northGround);
        
        // South section (below pool)
        const southGround = new Cube(gl);
        southGround.setPosition(this.mapSize / 2 - 0.5, 0, poolStart + this.poolSize + poolStart / 2 - 0.5);
        southGround.setScale(this.mapSize, 0.1, poolStart);
        this.groundSections.push(southGround);
        
        // West section (left of pool)
        const westGround = new Cube(gl);
        westGround.setPosition(poolStart / 2 - 0.5, 0, poolStart + this.poolSize / 2 - 0.5);
        westGround.setScale(poolStart, 0.1, this.poolSize);
        this.groundSections.push(westGround);
        
        // East section (right of pool) 
        const eastGround = new Cube(gl);
        eastGround.setPosition(poolStart + this.poolSize + poolStart / 2 - 0.5, 0, poolStart + this.poolSize / 2 - 0.5);
        eastGround.setScale(poolStart, 0.1, this.poolSize);
        this.groundSections.push(eastGround);
        
        // Create skybox components
        this.createSkybox();
        
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
        
        // Add some structural columns/pillars - more for better proportions
        for (let x = 8; x < this.mapSize - 8; x += 6) {
            for (let z = 8; z < this.mapSize - 8; z += 6) {
                this.map[x][z] = this.maxHeight;
            }
        }
    }

    // Create skybox components
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
        this.skyboxFloor.setPosition(this.mapSize / 2 - 0.5, -401, this.mapSize / 2 - 0.5);
        this.skyboxFloor.setScale(799, 0.01, 799);

        // Create a dedicated ground plane WAY below everything
        this.skyboxGroundPlane = new Cube(gl); 
        this.skyboxGroundPlane.setPosition(this.mapSize / 2 - 0.5, -200, this.mapSize / 2 - 0.5);
        this.skyboxGroundPlane.setScale(2000, 0.1, 2000);
    }
    
    // Create textures programmatically
    createTextures() {
        const gl = this.gl;

        // Initialize texture objects with procedural placeholders
        this.textures = {
            wall: this.createPlaceholderTexture([40, 100, 180, 255]),
            floor: this.createPlaceholderTexture([240, 240, 240, 255]),
            ceiling: this.createPlaceholderTexture([40, 100, 180, 255]),
            water: this.createPlaceholderTexture([100, 180, 255, 200]),
            poolBottom: this.createPlaceholderTexture([240, 240, 240, 255]),
            skyboxCeiling: this.createPlaceholderTexture([135, 206, 250, 255]),
            skyboxFloor: this.createPlaceholderTexture([200, 200, 230, 255]),
            skyboxWall: this.createPlaceholderTexture([120, 180, 255, 255]),
            pillar: this.createPlaceholderTexture([220, 220, 220, 255]),
            poolWall: this.createPlaceholderTexture([120, 180, 255, 255])
        };

        // Add textures for different block types
        this.textures.stone = this.createPlaceholderTexture([120, 120, 120, 255]);
        this.textures.wood = this.createPlaceholderTexture([150, 100, 50, 255]);
        this.textures.glass = this.createPlaceholderTexture([200, 230, 255, 180]);

        // Load image-based textures
        this.loadTextureFromFile('textures/end_stone_bricks.png', 'floor');
        this.loadTextureFromFile('textures/stone_bricks.png', 'poolBottom');
        this.loadTextureFromFile('textures/end_stone_bricks.png', 'wall');
        this.loadTextureFromFile('textures/end_stone_bricks.png', 'ceiling');
        this.loadTextureFromFile('textures/dark_prismarine.png', 'pillar');
        this.loadTextureFromFile('textures/stone.jpg', 'stone');
        this.loadTextureFromFile('textures/wood.jpg', 'wood');
        this.loadTextureFromFile('textures/glass.jpg', 'glass', {
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE
        });

        // Load skybox textures
        this.loadTextureFromFile('textures/sky_texture.jpg', 'skyboxCeiling');
        this.loadTextureFromFile('textures/skyfloor_texture.jpg', 'skyboxFloor', {
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE
        });
        this.loadTextureFromFile('textures/skybox_render.jpg', 'skyboxWall');
        this.loadTextureFromFile('textures/stone_bricks.png', 'poolWall');
    }

    // Create placeholder texture with a specific color
    createPlaceholderTexture(color) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        const pixels = new Uint8Array([
            color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3]
        ]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        
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
        
        const settings = {
            minFilter: gl.LINEAR_MIPMAP_LINEAR,
            magFilter: gl.LINEAR,
            wrapS: gl.REPEAT,
            wrapT: gl.REPEAT,
            pixelated: false,
            ...options
        };
        
        if (settings.pixelated) {
            settings.minFilter = gl.NEAREST_MIPMAP_LINEAR;
            settings.magFilter = gl.NEAREST;
        }
        
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this.textures[textureKey]);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            
            const isPowerOf2 = (value) => (value & (value - 1)) === 0;
            
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, settings.minFilter);
                
                const ext = gl.getExtension('EXT_texture_filter_anisotropic');
                if (ext) {
                    const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
                    gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, max));
                }
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
            
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, settings.magFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, settings.wrapS);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, settings.wrapT);
            
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        };
        
        image.onerror = () => {
            console.error(`Failed to load texture from: ${url}`);
        };
        
        image.src = url;
    }

    // Create an enhanced water texture
    createEnhancedWaterTexture() {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base water color
        ctx.fillStyle = 'rgba(100, 150, 200, 0.7)'; // Light blue, base opacity 0.7
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 25);
            
            for (let x = 0; x < canvas.width; x += 5) {
                const y = i * 25 + Math.sin(x / 30 + i) * 10;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
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
        
        // Create ceiling at max height - EXTENDED to cover entire room including over windows
        for (let x = 0; x < this.mapSize; x++) {
            for (let z = 0; z < this.mapSize; z++) {
                const ceiling = new Cube(gl);
                ceiling.setPosition(x, this.maxHeight + 0.5, z);
                ceiling.type = 'ceiling';
                this.cubes.push(ceiling);
            }
        }
        
        // Create walls based on the map
        for (let x = 0; x < this.mapSize; x++) {
            for (let z = 0; z < this.mapSize; z++) {
                const height = this.map[x][z];

                // ---- START DEBUG LOGGING ----
                // Log info for cells that are part of the 2x2 pillar structures
                // Pillars are at (8,8), (8,16), (16,8), (16,16) and their +1 offsets
                const isPotentialPillarLocation = 
                    ((x >= 8 && x <= 9) || (x >= 16 && x <= 17)) &&
                    ((z >= 8 && z <= 9) || (z >= 16 && z <= 17));

                if (isPotentialPillarLocation && height > 0) {
                    console.log(`PillarDebug: Cell (${x},${z}): map_height=${height}, this.maxHeight=${this.maxHeight}`);
                }
                // ---- END DEBUG LOGGING ----

                if (height > 0) {
                    const isOuterWall = (x === 0 || x === this.mapSize - 1 || z === 0 || z === this.mapSize - 1);
                    const isPillarCell = (height === this.maxHeight && !isOuterWall);

                    // ---- START DEBUG LOGGING ----
                    if (isPotentialPillarLocation && height > 0) {
                         console.log(`PillarDebug: Cell (${x},${z}): isPillarCell=${isPillarCell}, isOuterWall=${isOuterWall}`);
                    }
                    // ---- END DEBUG LOGGING ----
                    
                    let startY = 0;
                    if (isPillarCell) {
                        startY = -1; 
                    }

                    for (let y = startY; y < height; y++) { 
                        const cube = new Cube(gl);
                        cube.setPosition(x, y + 0.5, z); 
                        
                        if (isPillarCell) {
                            cube.type = 'pillar';
                        } else {
                            if (y === 0) { 
                                cube.type = 'floor'; 
                            } else {
                                cube.type = 'wall'; 
                            }
                        }
                        this.cubes.push(cube);
                    }
                }
            }
        }
        
        // FIXED: Pool floor positioning
        const poolFloor = new Cube(gl);
        const poolStart = (this.mapSize - this.poolSize) / 2;
        poolFloor.setPosition(this.mapSize / 2 - 0.5, -1, this.mapSize / 2 - 0.5);
        poolFloor.setScale(this.poolSize - 0.1, 0.1, this.poolSize - 0.1); // Slightly smaller to avoid z-fighting
        poolFloor.type = 'poolBottom';
        this.poolFloor = poolFloor;

        // FIXED: Pool water positioning
        this.poolWater = new Cube(gl);
        this.poolWater.setPosition(this.mapSize / 2 - 0.5, -0.05, this.mapSize / 2 - 0.5);
        this.poolWater.setScale(this.poolSize - 0.2, 0.1, this.poolSize - 0.2); // Slightly smaller than pool
        this.poolWater.type = 'water';

        // FIXED: Pool walls with proper alignment
        this.poolWalls = [];
        const poolX = this.mapSize / 2 - 0.5;
        const poolZ = this.mapSize / 2 - 0.5;
        const halfPool = this.poolSize / 2;
        const wallThickness = 0.3;
        const wallHeight = 1.0;

        // North wall
        const northWall = new Cube(gl);
        northWall.setPosition(poolX, -0.5, poolZ - halfPool + wallThickness/2);
        northWall.setScale(this.poolSize, wallHeight, wallThickness);
        northWall.type = 'poolWall';
        this.poolWalls.push(northWall);

        // South wall
        const southWall = new Cube(gl);
        southWall.setPosition(poolX, -0.5, poolZ + halfPool - wallThickness/2);
        southWall.setScale(this.poolSize, wallHeight, wallThickness);
        southWall.type = 'poolWall';
        this.poolWalls.push(southWall);

        // West wall (adjusted to not overlap corners)
        const westWall = new Cube(gl);
        westWall.setPosition(poolX - halfPool + wallThickness/2, -0.5, poolZ);
        westWall.setScale(wallThickness, wallHeight, this.poolSize - wallThickness * 2);
        westWall.type = 'poolWall';
        this.poolWalls.push(westWall);

        // East wall (adjusted to not overlap corners)
        const eastWall = new Cube(gl);
        eastWall.setPosition(poolX + halfPool - wallThickness/2, -0.5, poolZ);
        eastWall.setScale(wallThickness, wallHeight, this.poolSize - wallThickness * 2);
        eastWall.type = 'poolWall';
        this.poolWalls.push(eastWall);
    }
    
    // Render the entire poolroom
    render(gl, program, camera) {
        const viewMatrix = camera.viewMatrix;
        const projectionMatrix = camera.projectionMatrix;
        
        // Set shader uniforms
        const u_baseColor = gl.getUniformLocation(program, 'u_baseColor');
        const u_texColorWeight = gl.getUniformLocation(program, 'u_texColorWeight');
        const u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
        const u_TexScale = gl.getUniformLocation(program, 'u_TexScale');
        
        gl.uniform1i(u_Sampler, 0);

        // Render skybox components
        gl.depthFunc(gl.LEQUAL);

        // 1. Skybox walls
        gl.bindTexture(gl.TEXTURE_2D, this.textures.skyboxWall);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 1.0);
        gl.uniform2f(u_TexScale, 1.0, 1.0);
        this.skyboxWalls.render(gl, program, viewMatrix, projectionMatrix, 1.0);

        // 2. Skybox ceiling
        gl.bindTexture(gl.TEXTURE_2D, this.textures.skyboxCeiling);
        gl.uniform2f(u_TexScale, 1.0, 1.0);
        this.skyboxCeiling.render(gl, program, viewMatrix, projectionMatrix, 1.0);
        
        // 3. Skybox ground plane
        gl.bindTexture(gl.TEXTURE_2D, this.textures.skyboxFloor);
        gl.uniform2f(u_TexScale, 500.0, 500.0);
        this.skyboxGroundPlane.render(gl, program, viewMatrix, projectionMatrix, 1.0);

        gl.depthFunc(gl.LESS);
        
        // 4. Render ground sections with proper texture scaling
        gl.bindTexture(gl.TEXTURE_2D, this.textures.floor);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 0.95);
        
        for (let i = 0; i < this.groundSections.length; i++) {
            const section = this.groundSections[i];
            const scale = section.modelMatrix.elements;
            // Use 1:1 tile ratio - each tile is 1x1 unit
            const texScaleX = scale[0];
            const texScaleZ = scale[10];
            gl.uniform2f(u_TexScale, texScaleX, texScaleZ);
            section.render(gl, program, viewMatrix, projectionMatrix, 0.95);
        }
        
        // 5. Render pool floor
        gl.bindTexture(gl.TEXTURE_2D, this.textures.poolBottom);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 0.95);
        gl.uniform2f(u_TexScale, this.poolSize, this.poolSize);
        this.poolFloor.render(gl, program, viewMatrix, projectionMatrix, 0.95);
        
        // 6. Render pool walls
        gl.bindTexture(gl.TEXTURE_2D, this.textures.poolWall);
        for (const wall of this.poolWalls) {
            const scale = wall.modelMatrix.elements;
            // Make tiles square on walls - width and height should match
            const texScaleX = scale[0];  // Wall width
            const texScaleY = scale[5];  // Wall height
            gl.uniform2f(u_TexScale, texScaleX, texScaleY);
            wall.render(gl, program, viewMatrix, projectionMatrix, 0.95);
        }
        
        // 7. Render pool water with transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        gl.depthMask(false); // Disable depth writes for transparent water

        gl.bindTexture(gl.TEXTURE_2D, this.textures.water);
        gl.uniform4f(u_baseColor, 0.2, 0.6, 0.9, 0.6); 
        gl.uniform1f(u_texColorWeight, 0.8); 
        gl.uniform2f(u_TexScale, 4.0, 4.0); 
        if (this.poolWater) {
            this.poolWater.render(gl, program, viewMatrix, projectionMatrix, 0.8); 
        }
        
        gl.depthMask(true); // Re-enable depth writes for subsequent opaque objects
        gl.disable(gl.BLEND);
        
        // 8. Render all walls, ceiling, and other cubes (including pillars)
        for (const cube of this.cubes) {
            // Select texture and scale based on cube type
            if (cube.type === 'ceiling') {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.ceiling);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 0.95);
                gl.uniform2f(u_TexScale, 1.0, 1.0);  // 1:1 tile ratio for ceiling
            }
            else if (cube.type === 'pillar') {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.pillar);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 1.0);
                // Make tiles square on pillars
                const height = cube.modelMatrix.elements[5]; // Y scale
                gl.uniform2f(u_TexScale, 1.0, height);  // 1 tile wide, height tiles tall
            }
            else if (cube.type === 'wall') {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.wall);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 0.95);
                // Make tiles square on walls
                const height = cube.modelMatrix.elements[5]; // Y scale
                gl.uniform2f(u_TexScale, 1.0, height);  // 1 tile wide, height tiles tall
            }
            else {
                // Default texture handling
                gl.bindTexture(gl.TEXTURE_2D, this.textures.wall);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 0.95);
                gl.uniform2f(u_TexScale, 1.0, 1.0);  // Default 1:1 scaling
            }
            
            cube.render(gl, program, viewMatrix, projectionMatrix, 0.95);
        }
    }
}