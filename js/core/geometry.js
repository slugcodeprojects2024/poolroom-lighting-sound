class Cube {
    constructor(gl) {
        this.gl = gl;
        this.vertexBuffer = null;
        this.colorBuffer = null; // Keep for now, might remove if using only textures
        this.texCoordBuffer = null; // Added for texture coordinates
        this.indexBuffer = null;
        this.numIndices = 0;
        
        this.init();
    }
    
    /**
     * Initialize cube geometry
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
        
        // Define colors (r, g, b, a) for each vertex
        const colors = new Float32Array([
            // Front face (blue)
            0.0, 0.7, 1.0, 1.0,
            0.0, 0.7, 1.0, 1.0,
            0.0, 0.7, 1.0, 1.0,
            0.0, 0.7, 1.0, 1.0,
            
            // Back face (cyan)
            0.0, 1.0, 1.0, 1.0,
            0.0, 1.0, 1.0, 1.0,
            0.0, 1.0, 1.0, 1.0,
            0.0, 1.0, 1.0, 1.0,
            
            // Top face (light blue)
            0.5, 0.7, 1.0, 1.0,
            0.5, 0.7, 1.0, 1.0,
            0.5, 0.7, 1.0, 1.0,
            0.5, 0.7, 1.0, 1.0,
            
            // Bottom face (teal)
            0.0, 0.8, 0.8, 1.0,
            0.0, 0.8, 0.8, 1.0,
            0.0, 0.8, 0.8, 1.0,
            0.0, 0.8, 0.8, 1.0,
            
            // Right face (light cyan)
            0.6, 1.0, 1.0, 1.0,
            0.6, 1.0, 1.0, 1.0,
            0.6, 1.0, 1.0, 1.0,
            0.6, 1.0, 1.0, 1.0,
            
            // Left face (azure)
            0.0, 0.5, 1.0, 1.0,
            0.0, 0.5, 1.0, 1.0,
            0.0, 0.5, 1.0, 1.0,
            0.0, 0.5, 1.0, 1.0
        ]);
        
        // Define texture coordinates (UVs) for each vertex
        // Match the vertex order
        const texCoords = new Float32Array([
            // Front face
            0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
            // Back face
            1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,
            // Top face
            0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,
            // Bottom face
            1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,
            // Right face
            1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,
            // Left face
            0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
        ]);
        
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
        
        // Create and bind color buffer
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
        
        // Create and bind texture coordinate buffer
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
        
        // Create and bind index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        
        this.numIndices = indices.length;
    }
    
    /**
     * Draw the cube
     * @param {Shader} shader - Shader program to use
     */
    draw(shader) {
        const gl = this.gl;
        
        // Get attribute locations
        const positionAttrib = shader.getAttribLocation('a_position');
        const colorAttrib = shader.getAttribLocation('a_color');
        const texCoordAttrib = shader.getAttribLocation('a_texCoord'); // Added
        
        // Enable attributes
        gl.enableVertexAttribArray(positionAttrib);
        if (colorAttrib !== -1) { // Check if attribute exists
             gl.enableVertexAttribArray(colorAttrib);
        }
        if (texCoordAttrib !== -1) { // Check if attribute exists
            gl.enableVertexAttribArray(texCoordAttrib);
        }
        
        // Bind vertex buffer and set attribute pointers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
        
        // Bind color buffer and set attribute pointers (optional, if still using color)
        if (colorAttrib !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
            gl.vertexAttribPointer(colorAttrib, 4, gl.FLOAT, false, 0, 0);
        }
        
        // Bind texture coordinate buffer and set attribute pointers
        if (texCoordAttrib !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
            gl.vertexAttribPointer(texCoordAttrib, 2, gl.FLOAT, false, 0, 0); // 2 components (u, v)
        }
        
        // Bind index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        
        // Draw elements
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
        
        // Clean up
        gl.disableVertexAttribArray(positionAttrib);
        if (colorAttrib !== -1) {
            gl.disableVertexAttribArray(colorAttrib);
        }
        if (texCoordAttrib !== -1) {
            gl.disableVertexAttribArray(texCoordAttrib);
        }
    }
}

// Helper function to create a transformation matrix
function createTransformationMatrix() {
    // Identity matrix
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}

// Matrix multiplication (simplified for demonstration)
function multiplyMatrices(a, b) {
    const result = new Float32Array(16);
    
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            let sum = 0;
            for (let k = 0; k < 4; k++) {
                sum += a[i * 4 + k] * b[k * 4 + j];
            }
            result[i * 4 + j] = sum;
        }
    }
    
    return result;
}

// Create a translation matrix
function createTranslationMatrix(x, y, z) {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1
    ]);
}

// Create a rotation matrix around Y axis
function createRotationYMatrix(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    
    return new Float32Array([
        c, 0, s, 0,
        0, 1, 0, 0,
        -s, 0, c, 0,
        0, 0, 0, 1
    ]);
}

// Create a scale matrix
function createScaleMatrix(x, y, z) {
    return new Float32Array([
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1
    ]);
}