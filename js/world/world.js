class World {
    constructor(gl) {
        this.gl = gl;
        this.blocks = {};
        this.worldData = [];
        this.blockSize = 1.0; // Size of each block
        this.width = 32;     // Width of the world (X axis)
        this.depth = 32;     // Depth of the world (Z axis)
        this.height = 16;    // Maximum height of the world (Y axis)
        
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
    }
    
    /**
     * Generate the world from a 2D height map
     * @param {Array<Array<number>>} heightMap - 2D array of height values
     * @param {number} waterLevel - Water level height
     */
    generateFromHeightMap(heightMap, waterLevel = 1) {
        this.worldData = [];
        
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
                        this.worldData.push({
                            x: x,
                            y: y,
                            z: z,
                            type: 'tile'
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
            }
        }
        
        // Add ground plane
        for (let z = 0; z < this.depth; z++) {
            for (let x = 0; x < this.width; x++) {
                // Get height at this position (or default to 0)
                const blockHeight = heightMap && heightMap[z] && heightMap[z][x] !== undefined 
                    ? heightMap[z][x] 
                    : 0;
                
                // Only add ground where there's no solid block
                if (blockHeight <= 0) {
                    this.worldData.push({
                        x: x,
                        y: 0,
                        z: z,
                        type: 'default'
                    });
                }
            }
        }
    }
    
    /**
     * Generate a simple test world
     */
    generateTestWorld() {
        // Create a simple height map for testing
        const heightMap = Array(this.depth).fill().map(() => Array(this.width).fill(0));
        
        // Make some walls
        for (let z = 5; z < 10; z++) {
            for (let x = 5; x < 15; x++) {
                heightMap[z][x] = 3; // Wall height = 3
            }
        }
        
        // Make some columns
        for (let z = 15; z < 25; z += 3) {
            for (let x = 5; x < 25; x += 3) {
                heightMap[z][x] = 4; // Column height = 4
            }
        }
        
        // Water level
        const waterLevel = 2;
        
        // Generate world from this height map
        this.generateFromHeightMap(heightMap, waterLevel);
    }
    
    /**
     * Check if there's a solid block at the specified position
     * @param {number} x - X position in world coordinates
     * @param {number} y - Y position in world coordinates
     * @param {number} z - Z position in world coordinates
     * @returns {Object|null} - Block data if solid, null otherwise
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
        
        // Check surrounding blocks
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                for (let x = -1; x <= 1; x++) {
                    const block = this.getBlockAt(px + x * radius, py + y * radius, pz + z * radius);
                    
                    if (block && block.type !== 'water') {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * Draw the world
     * @param {Shader} shader - Shader program to use
     */
    draw(shader) {
        // Use shader
        shader.use();
        
        // Draw each block
        for (const block of this.worldData) {
            this.blocks[block.type].draw(
                shader, 
                block.x * this.blockSize, 
                block.y * this.blockSize, 
                block.z * this.blockSize
            );
        }
    }
}