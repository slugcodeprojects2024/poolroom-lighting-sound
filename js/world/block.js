class Block {
    constructor(gl, type = 'default') {
        this.gl = gl;
        this.type = type;
        this.vertexBuffer = null;
        this.colorBuffer = null;
        this.textureCoordBuffer = null;
        this.indexBuffer = null;
        this.numIndices = 0;
        
        // Initialize geometry
        this.init();
    }
    
    /**
     * Initialize block geometry
     */
    init() {
        const gl = this.gl;
        
        // Define vertices (x, y, z) for a cube with side length 1
        // centered at the origin
        const vertices = new Float32Array([
            // Front face
            -0.5, -0.5,  0.5,
             0.5, -0.5,  0.5,
             0.5,  0.5,  0.5,
            -0.5,  0.5,  0.5,
            
            // Back face
            -0.5, -0.5, -0.5,
            -0.5,  0.5, -0.5,
             0.5,  0.5, -0.5,
             0.5, -0.5, -0.5,
            
            // Top face
            -0.5,  0.5, -0.5,
            -0.5,  0.5,  0.5,
             0.5,  0.5,  0.5,
             0.5,  0.5, -0.5,
            
            // Bottom face
            -0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
             0.5, -0.5,  0.5,
            -0.5, -0.5,  0.5,
            
            // Right face
             0.5, -0.5, -0.5,
             0.5,  0.5, -0.5,
             0.5,  0.5,  0.5,
             0.5, -0.5,  0.5,
            
            // Left face
            -0.5, -0.5, -0.5,
            -0.5, -0.5,  0.5,
            -0.5,  0.5,  0.5,
            -0.5,  0.5, -0.5
        ]);
        
        // Define texture coordinates for each vertex
        const textureCoords = new Float32Array([
            // Front face
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            
            // Back face
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            0.0, 1.0,
            
            // Top face
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            
            // Bottom face
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            
            // Right face
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
            0.0, 1.0,
            
            // Left face
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ]);
        
        // Colors based on block type
        let colors;
        
        switch(this.type) {
            case 'water':
                colors = new Float32Array(24 * 4).fill(0); // 24 vertices, 4 components (r,g,b,a)
                for (let i = 0; i < 24; i++) {
                    colors[i * 4 + 0] = 0.0;  // R
                    colors[i * 4 + 1] = 0.7;  // G
                    colors[i * 4 + 2] = 1.0;  // B
                    colors[i * 4 + 3] = 0.8;  // A (semi-transparent for water)
                }
                break;
            case 'tile':
                colors = new Float32Array(24 * 4).fill(0);
                for (let i = 0; i < 24; i++) {
                    // Slightly vary the color for different faces
                    const faceIndex = Math.floor(i / 4);
                    const brightness = 0.9 + (faceIndex % 3) * 0.03;
                    
                    colors[i * 4 + 0] = 0.2 * brightness;  // R
                    colors[i * 4 + 1] = 0.7 * brightness;  // G
                    colors[i * 4 + 2] = 0.9 * brightness;  // B
                    colors[i * 4 + 3] = 1.0;              // A
                }
                break;
            case 'wall':
                colors = new Float32Array(24 * 4).fill(0);
                for (let i = 0; i < 24; i++) {
                    // Slightly vary the color for different faces
                    const faceIndex = Math.floor(i / 4);
                    const brightness = 0.85 + (faceIndex % 3) * 0.05;
                    
                    colors[i * 4 + 0] = 0.4 * brightness;  // R
                    colors[i * 4 + 1] = 0.8 * brightness;  // G
                    colors[i * 4 + 2] = 0.9 * brightness;  // B
                    colors[i * 4 + 3] = 1.0;              // A
                }
                break;
            default:
                colors = new Float32Array(24 * 4).fill(0);
                for (let i = 0; i < 24; i++) {
                    // Slightly vary the color for different faces
                    const faceIndex = Math.floor(i / 4);
                    const brightness = 0.8 + (faceIndex % 3) * 0.05;
                    
                    colors[i * 4 + 0] = 0.5 * brightness;  // R
                    colors[i * 4 + 1] = 0.5 * brightness;  // G
                    colors[i * 4 + 2] = 0.6 * brightness;  // B
                    colors[i * 4 + 3] = 1.0;              // A
                }
                break;
        }
        
        // Define indices for triangles
        const indices = new Uint16Array([
            0,  1,  2,    0,  2,  3,  // Front face
            4,  5,  6,    4,  6,  7,  // Back face
            8,  9,  10,   8,  10, 11, // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ]);
        
        // Create and bind vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        // Create and bind texture coordinate buffer
        this.textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);
        
        // Create and bind color buffer
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
        
        // Create and bind index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        
        this.numIndices = indices.length;
    }
    
    /**
     * Draw the block
     * @param {Shader} shader - Shader program to use
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     * @param {number} scale - Scale factor (default: 1)
     */
    draw(shader, x, y, z, scale = 1) {
        const gl = this.gl;
        
        // Create model matrix for this instance
        const translation = createTranslationMatrix(x, y, z);
        const scaleMatrix = createScaleMatrix(scale, scale, scale);
        const modelMatrix = multiplyMatrices(translation, scaleMatrix);
        
        // Set model matrix
        shader.setMatrix4('u_modelMatrix', modelMatrix);
        
        // Set block type as uniform (for shader to handle different block types)
        const blockTypeUniform = shader.getUniformLocation('u_blockType');
        if (blockTypeUniform !== null) {
            let typeValue = 0; // default
            if (this.type === 'water') typeValue = 1;
            if (this.type === 'tile') typeValue = 2;
            if (this.type === 'wall') typeValue = 3;
            gl.uniform1i(blockTypeUniform, typeValue);
        }
        
        // Get attribute locations
        const positionAttrib = shader.getAttribLocation('a_position');
        const colorAttrib = shader.getAttribLocation('a_color');
        const texCoordAttrib = shader.getAttribLocation('a_texCoord');
        
        // Enable attributes
        gl.enableVertexAttribArray(positionAttrib);
        gl.enableVertexAttribArray(colorAttrib);
        
        if (texCoordAttrib !== -1) {
            gl.enableVertexAttribArray(texCoordAttrib);
        }
        
        // Bind vertex buffer and set attribute pointers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
        
        // Bind color buffer and set attribute pointers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(colorAttrib, 4, gl.FLOAT, false, 0, 0);
        
        // Bind texture coordinate buffer if shader supports it
        if (texCoordAttrib !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
            gl.vertexAttribPointer(texCoordAttrib, 2, gl.FLOAT, false, 0, 0);
        }
        
        // Bind index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        
        // Enable alpha blending for transparent blocks
        if (this.type === 'water') {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }
        
        // Draw elements
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
        
        // Disable blending after drawing
        if (this.type === 'water') {
            gl.disable(gl.BLEND);
        }
        
        // Clean up
        gl.disableVertexAttribArray(positionAttrib);
        gl.disableVertexAttribArray(colorAttrib);
        
        if (texCoordAttrib !== -1) {
            gl.disableVertexAttribArray(texCoordAttrib);
        }
    }
}