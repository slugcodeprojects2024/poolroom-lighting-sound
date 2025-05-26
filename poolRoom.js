import { CubeWithNormals } from './geometryWithNormals.js';

// Updated poolRoom.js with lighting support
export class PoolRoomWithLighting {
    constructor(gl) {
        this.gl = gl;
        this.mapSize = 32;
        this.maxHeight = 4;
        this.map = [];
        this.cubes = [];
        this.cornerHoleDetails = [];
        
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
        this.createEnhancedWaterTexture();
        this.createTextures();
        
        // Create ground sections with normals support
        this.groundSections = [];
        const poolStart = (this.mapSize - this.poolSize) / 2;
        
        // North section (above pool)
        const northGround = new CubeWithNormals(gl);
        northGround.setPosition(this.mapSize / 2 - 0.5, 0, poolStart / 2 - 0.5);
        northGround.setScale(this.mapSize, 0.1, poolStart);
        this.groundSections.push(northGround);
        
        // South section (below pool)
        const southGround = new CubeWithNormals(gl);
        southGround.setPosition(this.mapSize / 2 - 0.5, 0, poolStart + this.poolSize + poolStart / 2 - 0.5);
        southGround.setScale(this.mapSize, 0.1, poolStart);
        this.groundSections.push(southGround);
        
        // West section (left of pool)
        const westGround = new CubeWithNormals(gl);
        westGround.setPosition(poolStart / 2 - 0.5, 0, poolStart + this.poolSize / 2 - 0.5);
        westGround.setScale(poolStart, 0.1, this.poolSize);
        this.groundSections.push(westGround);
        
        // East section (right of pool)
        const eastGround = new CubeWithNormals(gl);
        eastGround.setPosition(poolStart + this.poolSize + poolStart / 2 - 0.5, 0, poolStart + this.poolSize / 2 - 0.5);
        eastGround.setScale(poolStart, 0.1, this.poolSize);
        this.groundSections.push(eastGround);
        
        // Create skybox components
        this.createSkybox();
        
        // Build the world objects with normals
        this.buildWorld();

        // Add tower base
        this.addTowerBase();
    }
    
    // Create the poolroom layout (same as before)
    createLayout() {
        // Create outer walls
        for (let x = 0; x < this.mapSize; x++) {
            for (let z = 0; z < this.mapSize; z++) {
                if (x === 0 || x === this.mapSize - 1 || z === 0 || z === this.mapSize - 1) {
                    this.map[x][z] = this.maxHeight;
                }
            }
        }
        
        // Create corner holes and add ladders
        const holeSize = 2;
        const ladderThickness = 0.1;

        // Corner 1: Top-Left
        let hx = 1;
        let hz = 1;
        if (hx + holeSize <= this.mapSize && hz + holeSize <= this.mapSize) {
            this.cornerHoleDetails.push({ x: hx, z: hz, size: holeSize });
            for (let i = 0; i < holeSize; i++) {
                for (let j = 0; j < holeSize; j++) {
                    this.map[hx + i][hz + j] = 0;
                }
            }
            // Add ladder
            const ladderCenterX = hx - 0.5 + ladderThickness / 2;
            const ladderCenterZ = hz;
            for (let y = 0; y <= this.maxHeight; y++) {
                const ladderCube = new CubeWithNormals(this.gl);
                ladderCube.setPosition(ladderCenterX, y + 0.5, ladderCenterZ);
                ladderCube.setScale(ladderThickness, 1, 1);
                ladderCube.type = 'ladder';
                this.cubes.push(ladderCube);
            }
        }

        // Corner 2: Top-Right
        hx = this.mapSize - 1 - holeSize;
        hz = 1;
        if (hx >= 0 && hz + holeSize <= this.mapSize) {
            this.cornerHoleDetails.push({ x: hx, z: hz, size: holeSize });
            for (let i = 0; i < holeSize; i++) {
                for (let j = 0; j < holeSize; j++) {
                    this.map[hx + i][hz + j] = 0;
                }
            }
            const ladderCenterX = hx + 1.5 - ladderThickness / 2;
            const ladderCenterZ = hz;
            for (let y = 0; y <= this.maxHeight; y++) {
                const ladderCube = new CubeWithNormals(this.gl);
                ladderCube.setPosition(ladderCenterX, y + 0.5, ladderCenterZ);
                ladderCube.setScale(ladderThickness, 1, 1);
                ladderCube.type = 'ladder';
                this.cubes.push(ladderCube);
            }
        }

        // Corner 3: Bottom-Left
        hx = 1;
        hz = this.mapSize - 1 - holeSize;
        if (hx + holeSize <= this.mapSize && hz >= 0) {
            this.cornerHoleDetails.push({ x: hx, z: hz, size: holeSize });
            for (let i = 0; i < holeSize; i++) {
                for (let j = 0; j < holeSize; j++) {
                    this.map[hx + i][hz + j] = 0;
                }
            }
            const ladderCenterX = hx - 0.5 + ladderThickness / 2;
            const ladderCenterZ = hz;
            for (let y = 0; y <= this.maxHeight; y++) {
                const ladderCube = new CubeWithNormals(this.gl);
                ladderCube.setPosition(ladderCenterX, y + 0.5, ladderCenterZ);
                ladderCube.setScale(ladderThickness, 1, 1);
                ladderCube.type = 'ladder';
                this.cubes.push(ladderCube);
            }
        }
        
        // Corner 4: Bottom-Right
        hx = this.mapSize - 1 - holeSize;
        hz = this.mapSize - 1 - holeSize;
        if (hx >= 0 && hz >= 0) {
            this.cornerHoleDetails.push({ x: hx, z: hz, size: holeSize });
            for (let i = 0; i < holeSize; i++) {
                for (let j = 0; j < holeSize; j++) {
                    this.map[hx + i][hz + j] = 0;
                }
            }
            const ladderCenterX = hx + 1.5 - ladderThickness / 2;
            const ladderCenterZ = hz;
            for (let y = 0; y <= this.maxHeight; y++) {
                const ladderCube = new CubeWithNormals(this.gl);
                ladderCube.setPosition(ladderCenterX, y + 0.5, ladderCenterZ);
                ladderCube.setScale(ladderThickness, 1, 1);
                ladderCube.type = 'ladder';
                this.cubes.push(ladderCube);
            }
        }
        
        // Create window patterns
        for (let z = 6; z < this.mapSize - 6; z += 8) {
            for (let y = 0; y < this.maxHeight - 1; y++) {
                this.map[0][z] = 0;
                this.map[0][z+1] = 0;
            }
        }
        
        for (let x = 8; x < this.mapSize - 8; x += 8) {
            this.map[x][0] = 0;
            this.map[x+1][0] = 0;
            this.map[x][this.mapSize-1] = 0;
            this.map[x+1][this.mapSize-1] = 0;
            this.map[this.mapSize-1][x] = 0;
            this.map[this.mapSize-1][x+1] = 0;
        }
        
        // Add structural columns/pillars
        for (let x = 8; x < this.mapSize - 8; x += 6) {
            for (let z = 8; z < this.mapSize - 8; z += 6) {
                this.map[x][z] = this.maxHeight;
            }
        }
    }

    // Create skybox components with normals support
    createSkybox() {
        const gl = this.gl;
        
        this.skyboxWalls = new CubeWithNormals(gl);
        this.skyboxWalls.setPosition(this.mapSize / 2 - 0.5, 0, this.mapSize / 2 - 0.5);
        this.skyboxWalls.setScale(800, 800, 800);
        
        this.skyboxCeiling = new CubeWithNormals(gl);
        this.skyboxCeiling.setPosition(this.mapSize / 2 - 0.5, 400, this.mapSize / 2 - 0.5);
        this.skyboxCeiling.setScale(800, 0.01, 800);
        
        this.skyboxFloor = new CubeWithNormals(gl);
        this.skyboxFloor.setPosition(this.mapSize / 2 - 0.5, -401, this.mapSize / 2 - 0.5);
        this.skyboxFloor.setScale(799, 0.01, 799);

        this.skyboxGroundPlane = new CubeWithNormals(gl);
        this.skyboxGroundPlane.setPosition(this.mapSize / 2 - 0.5, -200, this.mapSize / 2 - 0.5);
        this.skyboxGroundPlane.setScale(2000, 0.1, 2000);
    }
    
    // Create textures (same as before)
    createTextures() {
        const gl = this.gl;

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
            poolWall: this.createPlaceholderTexture([120, 180, 255, 255]),
            ladder: this.createPlaceholderTexture([100, 70, 30, 255], "ladder"),
        };

        this.textures.stone = this.createPlaceholderTexture([120, 120, 120, 255]);
        this.textures.wood = this.createPlaceholderTexture([150, 100, 50, 255]);
        this.textures.glass = this.createPlaceholderTexture([200, 230, 255, 180]);

        // Load image-based textures if available
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
        this.loadTextureFromFile('textures/sky_texture.jpg', 'skyboxCeiling');
        this.loadTextureFromFile('textures/skyfloor_texture.jpg', 'skyboxFloor', {
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE
        });
        this.loadTextureFromFile('textures/skybox_render.jpg', 'skyboxWall');
        this.loadTextureFromFile('textures/stone_bricks.png', 'poolWall');
    }

    // Create placeholder texture (same implementation)
    createPlaceholderTexture(color, type = "") {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${color[3] / 255})`;
        ctx.fillRect(0, 0, size, size);

        if (type === "ladder") {
            ctx.fillStyle = "#5a3a1a";
            const railWidth = size * 0.15;
            ctx.fillRect(size * 0.15, 0, railWidth, size);
            ctx.fillRect(size * 0.7, 0, railWidth, size);

            ctx.fillStyle = "#a67c52";
            const rungHeight = size * 0.08;
            for (let i = 1; i < 7; i++) {
                const y = i * size / 7;
                ctx.fillRect(size * 0.18, y, size * 0.64, rungHeight);
            }
        }

        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        return texture;
    }

    // Load texture from file (same implementation)
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

    // Enhanced water texture (same as before)
    createEnhancedWaterTexture() {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(100, 150, 200, 0.7)';
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
    
    // Build the 3D world based on the map with lighting support
    buildWorld() {
        const gl = this.gl;
        
        // Create ceiling with skylight gaps
        const gapX1 = 11;
        const gapX2 = 17;
        const gapStartZ = 8;
        const gapEndZ = 20;

        for (let x = 0; x < this.mapSize; x++) {
            for (let z = 0; z < this.mapSize; z++) {
                const isCentralGapCell = 
                    (x === gapX1 || x === gapX2) && 
                    (z >= gapStartZ && z <= gapEndZ);

                let isCornerGapCell = false;
                for (const hole of this.cornerHoleDetails) {
                    if (x >= hole.x && x < hole.x + hole.size &&
                        z >= hole.z && z < hole.z + hole.size) {
                        isCornerGapCell = true;
                        break;
                    }
                }

                if (!isCentralGapCell && !isCornerGapCell) {
                    const ceiling = new CubeWithNormals(gl);
                    ceiling.setPosition(x, this.maxHeight + 0.5, z);
                    ceiling.type = 'ceiling';
                    this.cubes.push(ceiling);
                }
            }
        }
        
        // Create walls based on the map
        for (let x = 0; x < this.mapSize; x++) {
            for (let z = 0; z < this.mapSize; z++) {
                const height = this.map[x][z];

                if (height > 0) {
                    const isOuterWall = (x === 0 || x === this.mapSize - 1 || z === 0 || z === this.mapSize - 1);
                    const isPillarCell = (height === this.maxHeight && !isOuterWall);
                    
                    let startY = 0;
                    if (isPillarCell) {
                        startY = -1; 
                    }

                    for (let y = startY; y < height; y++) { 
                        const cube = new CubeWithNormals(gl);
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
        
        // Pool floor with normals
        const poolFloor = new CubeWithNormals(gl);
        poolFloor.setPosition(this.mapSize / 2 - 0.5, -1, this.mapSize / 2 - 0.5);
        poolFloor.setScale(this.poolSize - 0.1, 0.1, this.poolSize - 0.1);
        poolFloor.type = 'poolBottom';
        this.poolFloor = poolFloor;

        // Pool water with normals
        this.poolWater = new CubeWithNormals(gl);
        this.poolWater.setPosition(this.mapSize / 2 - 0.5, -0.05, this.mapSize / 2 - 0.5);
        this.poolWater.setScale(this.poolSize - 0.2, 0.1, this.poolSize - 0.2);
        this.poolWater.type = 'water';

        // Pool walls with normals
        this.poolWalls = [];
        const poolX = this.mapSize / 2 - 0.5;
        const poolZ = this.mapSize / 2 - 0.5;
        const halfPool = this.poolSize / 2;
        const wallThickness = 0.3;
        const wallHeight = 1.0;

        // North wall
        const northWall = new CubeWithNormals(gl);
        northWall.setPosition(poolX, -0.5, poolZ - halfPool + wallThickness/2);
        northWall.setScale(this.poolSize, wallHeight, wallThickness);
        northWall.type = 'poolWall';
        this.poolWalls.push(northWall);

        // South wall
        const southWall = new CubeWithNormals(gl);
        southWall.setPosition(poolX, -0.5, poolZ + halfPool - wallThickness/2);
        southWall.setScale(this.poolSize, wallHeight, wallThickness);
        southWall.type = 'poolWall';
        this.poolWalls.push(southWall);

        // West wall
        const westWall = new CubeWithNormals(gl);
        westWall.setPosition(poolX - halfPool + wallThickness/2, -0.5, poolZ);
        westWall.setScale(wallThickness, wallHeight, this.poolSize - wallThickness * 2);
        westWall.type = 'poolWall';
        this.poolWalls.push(westWall);

        // East wall
        const eastWall = new CubeWithNormals(gl);
        eastWall.setPosition(poolX + halfPool - wallThickness/2, -0.5, poolZ);
        eastWall.setScale(wallThickness, wallHeight, this.poolSize - wallThickness * 2);
        eastWall.type = 'poolWall';
        this.poolWalls.push(eastWall);
    }
    
    // Add tower base with normals
    addTowerBase() {
        const ledgeWidth = 2;
        const towerBaseHeight = 40;
        const y = -towerBaseHeight / 2;

        // North ledge
        const northLedge = new CubeWithNormals(this.gl);
        northLedge.setPosition(
            this.mapSize / 2 - 0.5,
            y,
            -ledgeWidth / 2
        );
        northLedge.setScale(
            this.mapSize + 2 * ledgeWidth,
            towerBaseHeight,
            ledgeWidth
        );
        northLedge.type = 'towerBase';
        this.cubes.push(northLedge);

        // South ledge
        const southLedge = new CubeWithNormals(this.gl);
        southLedge.setPosition(
            this.mapSize / 2 - 0.5,
            y,
            this.mapSize - 0.5 + ledgeWidth / 2
        );
        southLedge.setScale(
            this.mapSize + 2 * ledgeWidth,
            towerBaseHeight,
            ledgeWidth
        );
        southLedge.type = 'towerBase';
        this.cubes.push(southLedge);

        // West ledge
        const westLedge = new CubeWithNormals(this.gl);
        westLedge.setPosition(
            -ledgeWidth / 2,
            y,
            this.mapSize / 2 - 0.5
        );
        westLedge.setScale(
            ledgeWidth,
            towerBaseHeight,
            this.mapSize
        );
        westLedge.type = 'towerBase';
        this.cubes.push(westLedge);

        // East ledge
        const eastLedge = new CubeWithNormals(this.gl);
        eastLedge.setPosition(
            this.mapSize - 0.5 + ledgeWidth / 2,
            y,
            this.mapSize / 2 - 0.5
        );
        eastLedge.setScale(
            ledgeWidth,
            towerBaseHeight,
            this.mapSize
        );
        eastLedge.type = 'towerBase';
        this.cubes.push(eastLedge);
    }
    
    // Get ladder at position (same as before)
    getLadderAt(playerPosition, playerDimensions) {
        const px = playerPosition[0];
        const py = playerPosition[1]; 
        const pz = playerPosition[2];
        const pWidth = playerDimensions[0];
        const pHeight = playerDimensions[1];
        const pDepth = playerDimensions[2];

        const playerMinX = px - pWidth / 2;
        const playerMaxX = px + pWidth / 2;
        const playerMinY = py;
        const playerMaxY = py + pHeight;
        const playerMinZ = pz - pDepth / 2;
        const playerMaxZ = pz + pDepth / 2;

        let closestLadder = null;
        let closestDistance = Infinity;
        const maxInteractionDistance = 1.5;

        for (const cube of this.cubes) {
            if (cube.type === 'ladder') {
                const m = cube.modelMatrix.elements;
                
                const ladderCenterX = m[12];
                const ladderCenterY = m[13];
                const ladderCenterZ = m[14];
                
                const ladderWidth = Math.abs(m[0]);
                const ladderHeight = Math.abs(m[5]);
                const ladderDepth = Math.abs(m[10]);

                const ladderMinX = ladderCenterX - ladderWidth / 2;
                const ladderMaxX = ladderCenterX + ladderWidth / 2;
                const ladderMinY = ladderCenterY - ladderHeight / 2;
                const ladderMaxY = ladderCenterY + ladderHeight / 2;
                const ladderMinZ = ladderCenterZ - ladderDepth / 2;
                const ladderMaxZ = ladderCenterZ + ladderDepth / 2;

                const intersectsX = playerMinX <= ladderMaxX && playerMaxX >= ladderMinX;
                const intersectsY = playerMinY <= ladderMaxY && playerMaxY >= ladderMinY;
                const intersectsZ = playerMinZ <= ladderMaxZ && playerMaxZ >= ladderMinZ;

                const intersects = intersectsX && intersectsY && intersectsZ;

                const distance = Math.sqrt(
                    Math.pow(px - ladderCenterX, 2) + 
                    Math.pow(py + pHeight/2 - ladderCenterY, 2) + 
                    Math.pow(pz - ladderCenterZ, 2)
                );

                if (intersects || distance < maxInteractionDistance) {
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestLadder = cube;
                    }
                }
            }
        }

        return closestLadder;
    }

    // Render with lighting support
    renderWithLighting(gl, program, camera, lightingSystem) {
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

        // Skybox walls
        gl.bindTexture(gl.TEXTURE_2D, this.textures.skyboxWall);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 1.0);
        gl.uniform2f(u_TexScale, 1.0, 1.0);
        this.skyboxWalls.render(gl, program, viewMatrix, projectionMatrix, 1.0, lightingSystem);

        // Skybox ceiling
        gl.bindTexture(gl.TEXTURE_2D, this.textures.skyboxCeiling);
        gl.uniform2f(u_TexScale, 1.0, 1.0);
        this.skyboxCeiling.render(gl, program, viewMatrix, projectionMatrix, 1.0, lightingSystem);
        
        // Skybox ground plane
        gl.bindTexture(gl.TEXTURE_2D, this.textures.skyboxFloor);
        gl.uniform2f(u_TexScale, 500.0, 500.0);
        this.skyboxGroundPlane.render(gl, program, viewMatrix, projectionMatrix, 1.0, lightingSystem);

        gl.depthFunc(gl.LESS);
        
        // Render ground sections
        gl.bindTexture(gl.TEXTURE_2D, this.textures.floor);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 0.95);
        
        for (let i = 0; i < this.groundSections.length; i++) {
            const section = this.groundSections[i];
            const scale = section.modelMatrix.elements;
            const texScaleX = scale[0];
            const texScaleZ = scale[10];
            gl.uniform2f(u_TexScale, texScaleX, texScaleZ);
            section.render(gl, program, viewMatrix, projectionMatrix, 0.95, lightingSystem);
        }
        
        // Render pool floor
        gl.bindTexture(gl.TEXTURE_2D, this.textures.poolBottom);
        gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
        gl.uniform1f(u_texColorWeight, 0.95);
        gl.uniform2f(u_TexScale, this.poolSize, this.poolSize);
        this.poolFloor.render(gl, program, viewMatrix, projectionMatrix, 0.95, lightingSystem);
        
        // Render pool walls
        gl.bindTexture(gl.TEXTURE_2D, this.textures.poolWall);
        for (const wall of this.poolWalls) {
            const scale = wall.modelMatrix.elements;
            const texScaleX = scale[0];
            const texScaleY = scale[5];
            gl.uniform2f(u_TexScale, texScaleX, texScaleY);
            wall.render(gl, program, viewMatrix, projectionMatrix, 0.95, lightingSystem);
        }
        
        // Render pool water with transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);

        gl.bindTexture(gl.TEXTURE_2D, this.textures.water);
        gl.uniform4f(u_baseColor, 0.2, 0.6, 0.9, 0.6); 
        gl.uniform1f(u_texColorWeight, 0.8); 
        gl.uniform2f(u_TexScale, 4.0, 4.0); 
        if (this.poolWater) {
            this.poolWater.render(gl, program, viewMatrix, projectionMatrix, 0.8, lightingSystem); 
        }
        
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        
        // Render all walls, ceiling, and other cubes with lighting
        for (const cube of this.cubes) {
            if (cube.type === 'ceiling') {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.ceiling);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 0.95);
                gl.uniform2f(u_TexScale, 1.0, 1.0);
            }
            else if (cube.type === 'pillar') {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.pillar);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 1.0);
                const height = cube.modelMatrix.elements[5];
                gl.uniform2f(u_TexScale, 1.0, height);
            }
            else if (cube.type === 'wall') {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.wall);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 0.95);
                const height = cube.modelMatrix.elements[5];
                gl.uniform2f(u_TexScale, 1.0, height);
            }
            else if (cube.type === 'ladder') {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.ladder);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 1.0);
                gl.uniform2f(u_TexScale, 1.0, 1.0);
            }
            else if (cube.type === 'towerBase') {
                gl.bindTexture(gl.TEXTURE_2D, this.textures.wall);
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 1.0);
                gl.uniform2f(u_TexScale, 4.0, 10.0);
            }
            else { // Default for 'floor' or any other unspecified types
                gl.bindTexture(gl.TEXTURE_2D, this.textures.wall); // Default to wall texture if type is floor or unknown
                gl.uniform4f(u_baseColor, 1.0, 1.0, 1.0, 1.0);
                gl.uniform1f(u_texColorWeight, 0.95);
                gl.uniform2f(u_TexScale, 1.0, 1.0);
            }
            
            cube.render(gl, program, viewMatrix, projectionMatrix, 0.95, lightingSystem);
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'ControlLeft') {
        camera.toggleLadderGrab();
    }
});