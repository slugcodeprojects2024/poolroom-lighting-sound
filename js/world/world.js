class World {
    constructor(gl) {
        this.gl = gl;
        this.blocks = {};
        this.worldData = [];
        this.blockSize = 1.0; // Size of each block
        this.width = 32;     // Width of the world (X axis)
        this.depth = 32;     // Depth of the world (Z axis)
        this.height = 16;    // Maximum height of the world (Y axis)
        this.waterLevel = 2; // Default water level height
        
        // Initialize block types
        this.initBlocks();
    }
    
    /**
     * Initialize different block types
     */
    initBlocks() {
        this.blocks.default = new Block(this.gl, 'default');
        this.blocks.water = new Block(this.gl, 'water');
        this.blocks.tile = new Block(this.gl, 'tile');
        this.blocks.wall = new Block(this.gl, 'wall');
    }
    
    /**
     * Generate the world from a 2D height map
     * @param {Array<Array<number>>} heightMap - 2D array of height values
     * @param {number} waterLevel - Water level height
     */
    generateFromHeightMap(heightMap, waterLevel = 2) {
        this.worldData = [];
        this.waterLevel = waterLevel;
        
        // Process the height map
        for (let z = 0; z < this.depth; z++) {
            for (let x = 0; x < this.width; x++) {
                // Get block height from map (or default to 0)
                const blockHeight = heightMap && heightMap[z] && heightMap[z][x] !== undefined 
                    ? heightMap[z][x] 
                    : 0;
                
                if (blockHeight > 0) {
                    // Add solid blocks up to the height
                    for (let y = 0; y < blockHeight; y++) {
                        // Use tile for the top, wall for sides
                        const blockType = y === blockHeight - 1 ? 'tile' : 'wall';
                        
                        this.worldData.push({
                            x: x,
                            y: y,
                            z: z,
                            type: blockType
                        });
                    }
                }
                
                // Add water blocks up to water level if block height is below water level
                if (blockHeight < waterLevel) {
                    for (let y = blockHeight; y < waterLevel; y++) {
                        this.worldData.push({
                            x: x,
                            y: y,
                            z: z,
                            type: 'water'
                        });
                    }
                }
                
                // Add ground plane at y=0 if no block
                if (blockHeight <= 0) {
                    this.worldData.push({
                        x: x,
                        y: 0,
                        z: z,
                        type: 'tile'
                    });
                }
            }
        }
        
        console.log(`World generated with ${this.worldData.length} blocks`);
    }
    
    /**
     * Generate a simple test world for the poolroom
     */
    generateTestWorld() {
        // Create a height map for testing (initialized with zeros)
        const heightMap = Array(this.depth).fill().map(() => Array(this.width).fill(0));
        
        // Create a border around the world
        for (let x = 0; x < this.width; x++) {
            for (let z = 0; z < this.depth; z++) {
                // Border walls
                if (x === 0 || x === this.width - 1 || z === 0 || z === this.depth - 1) {
                    heightMap[z][x] = 8; // 8 blocks high
                }
            }
        }
        
        // Create some columns
        for (let z = 5; z < this.depth - 5; z += 7) {
            for (let x = 5; x < this.width - 5; x += 7) {
                heightMap[z][x] = 8; // Column height
            }
        }
        
        // Create an elevated platform
        for (let z = 14; z < 24; z++) {
            for (let x = 12; x < 22; x++) {
                heightMap[z][x] = 3; // Platform height
            }
        }
        
        // Create a second elevated platform
        for (let z = 8; z < 12; z++) {
            for (let x = 22; x < 28; x++) {
                heightMap[z][x] = 5; // Platform height
            }
        }
        
        // Create stairs to the elevated platform
        for (let i = 0; i < 3; i++) {
            for (let x = 14 + i; x < 20 - i; x++) {
                heightMap[13 - i][x] = i + 1;
            }
        }
        
        // Set water level
        const waterLevel = 2;
        
        // Generate world from this height map
        this.generateFromHeightMap(heightMap, waterLevel);
    }
    
    /**
     * Check if there's a block at the specified position
     * @param {number} x - X position in world coordinates
     * @param {number} y - Y position in world coordinates
     * @param {number} z - Z position in world coordinates
     * @returns {Object|null} - Block data if found, null otherwise
     */
    getBlockAt(x, y, z) {
        // Convert world coordinates to grid coordinates
        const gridX = Math.floor(x / this.blockSize);
        const gridY = Math.floor(y / this.blockSize);
        const gridZ = Math.floor(z / this.blockSize);
        
        // Check bounds
        if (gridX < 0 || gridX >= this.width || 
            gridY < 0 || gridY >= this.height || 
            gridZ < 0 || gridZ >= this.depth) {
            return null;
        }
        
        // Find the block at this position
        for (const block of this.worldData) {
            if (block.x === gridX && block.y === gridY && block.z === gridZ) {
                return block;
            }
        }
        
        return null;
    }
    
    /**
     * Check if player collides with any solid blocks
     * @param {Array<number>} position - Player position [x, y, z]
     * @param {number} radius - Player collision radius
     * @returns {boolean} - Whether there's a collision
     */
    checkCollision(position, radius = 0.3) {
        // Check surrounding blocks
        const px = position[0];
        const py = position[1];
        const pz = position[2];
        
        // Check for head collision (height = 1.7 blocks)
        const headY = py + 1.7;
        
        // Check for foot collision
        const footY = py;
        
        // Check points around the player
        for (let offsetY = 0; offsetY <= 1; offsetY++) {
            const y = footY + offsetY;
            
            for (let offsetX = -1; offsetX <= 1; offsetX++) {
                for (let offsetZ = -1; offsetZ <= 1; offsetZ++) {
                    if (offsetX === 0 && offsetZ === 0) {
                        // Check center point only for head and feet
                        const block = this.getBlockAt(px, y, pz);
                        if (block && block.type !== 'water') {
                            return true; // Collision detected
                        }
                    } else {
                        // Check perimeter points at player radius
                        const checkX = px + offsetX * radius;
                        const checkZ = pz + offsetZ * radius;
                        
                        const block = this.getBlockAt(checkX, y, checkZ);
                        if (block && block.type !== 'water') {
                            return true; // Collision detected
                        }
                    }
                }
            }
        }
        
        // No collision
        return false;
    }
    
    /**
     * Check if player is in water
     * @param {Array<number>} position - Player position [x, y, z]
     * @returns {boolean} - Whether player is in water
     */
    isInWater(position) {
        const block = this.getBlockAt(position[0], position[1], position[2]);
        return block && block.type === 'water';
    }
    
    /**
     * Draw the world
     * @param {Shader} shader - Shader program to use
     * @param {number} time - Current time for animations
     */
    draw(shader, time) {
        // Set time uniform for water animation
        const timeLocation = shader.getUniformLocation('u_time');
        if (timeLocation !== null) {
            this.gl.uniform1f(timeLocation, time);
        }
        
        // Draw each block (non-water blocks first, then water)
        
        // First pass: draw solid blocks
        for (const block of this.worldData) {
            if (block.type !== 'water') {
                this.blocks[block.type].draw(
                    shader, 
                    block.x * this.blockSize, 
                    block.y * this.blockSize, 
                    block.z * this.blockSize
                );
            }
        }
        
        // Second pass: draw water blocks
        for (const block of this.worldData) {
            if (block.type === 'water') {
                this.blocks[block.type].draw(
                    shader, 
                    block.x * this.blockSize, 
                    block.y * this.blockSize, 
                    block.z * this.blockSize
                );
            }
        }
    }
}