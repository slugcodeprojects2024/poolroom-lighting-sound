class World {
    /**
     * Manages the game world, including blocks and textures.
     * @param {WebGLRenderingContext} gl - The WebGL context.
     * @param {Cube} cubeGeometry - Shared cube geometry instance.
     * @param {Shader} shader - Shared shader program instance.
     */
    constructor(gl, cubeGeometry, shader) {
        this.gl = gl;
        this.cubeGeometry = cubeGeometry;
        this.shader = shader;
        this.blocks = []; // Array to hold all Block instances
        this.textures = {}; // Object to store loaded textures by type
        this.map = []; // 2D array representing the world layout
    }

    /**
     * Loads textures required for the world blocks.
     * Call this before generateWorld.
     * Example texture paths: 'assets/textures/wall.png', 'assets/textures/floor.png'
     */
    loadTextures() {
        // Example: Load textures for different block types
        // Add more as needed based on your map values
        this.textures['wall'] = this.loadTexture('assets/textures/wall.png'); // Replace with your actual wall texture
        this.textures['floor'] = this.loadTexture('assets/textures/floor.png'); // Replace with your actual floor texture
        // Add textures for other block types (e.g., ceiling, different walls)
        // this.textures['ceiling'] = this.loadTexture('assets/textures/ceiling.png');
        // this.textures['debug'] = this.loadTexture('assets/textures/debug.png');
        console.log("Textures loading initiated.");
    }

    /**
     * Generates the world blocks based on a 2D map array.
     * @param {number[][]} mapData - A 2D array where numbers represent block types.
     *                                 Example: 0 = empty, 1 = wall, 2 = floor
     */
    generateWorld(mapData) {
        this.map = mapData;
        this.blocks = []; // Clear existing blocks

        if (!this.textures['wall'] || !this.textures['floor']) {
             console.warn("Textures not loaded before generating world. Using placeholders if available.");
             // Optionally load default/debug textures here if needed
             if (!this.textures['wall']) this.textures['wall'] = this.loadTexture('assets/textures/debug.png');
             if (!this.textures['floor']) this.textures['floor'] = this.loadTexture('assets/textures/debug.png');
        }


        const rows = mapData.length;
        const cols = mapData[0].length;

        for (let z = 0; z < rows; z++) {
            for (let x = 0; x < cols; x++) {
                const blockType = mapData[z][x];
                const position = [x, 0, z]; // Place blocks on the XZ plane at y=0 initially

                let texture = null;
                let typeString = 'empty';

                switch (blockType) {
                    case 0: // Empty space - do nothing, or maybe add air blocks later
                        continue; // Skip creating a block for empty space
                    case 1: // Wall block
                        texture = this.textures['wall'];
                        typeString = 'wall';
                        // Create wall blocks (potentially with height)
                        // For now, just one block at y=0
                        this.blocks.push(new Block(position, typeString, texture));
                        // Example: Add blocks above for wall height
                        // this.blocks.push(new Block([x, 1, z], typeString, texture));
                        // this.blocks.push(new Block([x, 2, z], typeString, texture));
                        break;
                    case 2: // Floor block
                        texture = this.textures['floor'];
                        typeString = 'floor';
                        this.blocks.push(new Block(position, typeString, texture));
                        break;
                    // Add more cases for different block types (e.g., ceiling, different walls)
                    default:
                        console.warn(`Unknown block type ${blockType} at [${x}, ${z}]`);
                        // Optionally use a default/debug texture
                        // texture = this.textures['debug'];
                        // if (texture) {
                        //     this.blocks.push(new Block(position, 'unknown', texture));
                        // }
                        break;
                }
            }
        }
        console.log(`World generated with ${this.blocks.length} blocks.`);
    }

    /**
     * Renders all the blocks in the world.
     * Assumes the shader program is already in use and camera matrices are set.
     */
    render() {
        // The shader should already be bound by the Engine before calling this
        // Camera uniforms should also be set by the Engine

        for (const block of this.blocks) {
            block.render(this.shader, this.cubeGeometry, this.gl);
        }
    }

    // --- Helper: Texture Loading (Copied from Engine for encapsulation) ---
    // You could also pass the engine's loadTexture function to the World constructor
    loadTexture(url) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue placeholder
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

            if (this.isPowerOf2(image.width) && this.isPowerOf2(image.height)) {
               gl.generateMipmap(gl.TEXTURE_2D);
            } else {
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
            console.log(`Texture loaded for world: ${url}`);
        };
        image.onerror = () => {
            console.error(`Failed to load world texture: ${url}`);
        };
        image.src = url;

        return texture;
    }

    isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }

    /**
     * Gets the block type at a specific world coordinate.
     * Note: This currently only checks the base layer (y=0).
     * Needs refinement for multi-layer worlds or different coordinate systems.
     * @param {number} x - World X coordinate
     * @param {number} z - World Z coordinate
     * @returns {number} - The block type from the map (e.g., 0, 1, 2), or -1 if out of bounds.
     */
    getBlockType(x, z) {
        const mapX = Math.floor(x);
        const mapZ = Math.floor(z);

        if (mapZ >= 0 && mapZ < this.map.length && mapX >= 0 && mapX < this.map[0].length) {
            return this.map[mapZ][mapX];
        }
        return -1; // Out of bounds
    }
}