// console.log('glMatrix type in block.js:', typeof glMatrix); // Keep or remove this debug line as needed
// const mat4 = glMatrix.mat4; // REMOVE this alias line

class Block {
    /**
     * Represents a single block (cube) in the world.
     * @param {vec3} position - The world position [x, y, z] of the block's center.
     * @param {string} type - The type of block (e.g., 'wall', 'floor', 'sky'). Determines texture.
     * @param {WebGLTexture} texture - The texture to apply to this block.
     */
    constructor(position, type, texture) {
        this.position = position; // Store position as [x, y, z]
        this.type = type;         // e.g., 'wall', 'floor'
        this.texture = texture;   // The specific texture for this block instance
        // Use glMatrix.mat4 directly here
        this.modelMatrix = glMatrix.mat4.create(); 

        // Update the model matrix based on the initial position
        // Use glMatrix.mat4 directly here
        glMatrix.mat4.translate(this.modelMatrix, this.modelMatrix, this.position); 
    }

    /**
     * Renders the block.
     * Assumes the correct shader program is already in use.
     * @param {Shader} shader - The shader program to use.
     * @param {Cube} cubeGeometry - The shared cube geometry instance.
     * @param {WebGLRenderingContext} gl - The WebGL context.
     */
    render(shader, cubeGeometry, gl) {
        // Set the model matrix uniform for this specific block
        shader.setMatrix4('u_modelMatrix', this.modelMatrix);

        // Bind the block's specific texture
        gl.activeTexture(gl.TEXTURE0); // Or another texture unit if needed
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        shader.setInt('u_texture', 0); // Tell shader to use texture unit 0
        shader.setBool('u_useTexture', true); // Ensure texture is used

        // Draw the cube geometry
        cubeGeometry.draw(shader);
    }

    // Add methods for collision detection, updates, etc. later if needed
}