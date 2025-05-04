// cube.js - Cube class for creating and rendering cubes

class Cube {
    constructor(gl) {
        this.gl = gl;
        this.vertexBuffer = null;
        this.texCoordBuffer = null;
        this.indexBuffer = null;
        this.numIndices = 0;
        
        // Model matrix for this cube
        this.modelMatrix = new Matrix4();
        
        // Initialize buffers
        this.initBuffers();
    }
    
    initBuffers() {
        const gl = this.gl;
        
        // Vertex coordinates (cube with side length = 1, centered at origin)
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
        
        // Texture coordinates
        const texCoords = new Float32Array([
            // Front face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            // Back face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
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
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            // Left face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ]);
        
        // Indices to draw the triangles
        const indices = new Uint16Array([
            0, 1, 2,     0, 2, 3,    // Front face
            4, 5, 6,     4, 6, 7,    // Back face
            8, 9, 10,    8, 10, 11,  // Top face
            12, 13, 14,  12, 14, 15, // Bottom face
            16, 17, 18,  16, 18, 19, // Right face
            20, 21, 22,  20, 22, 23  // Left face
        ]);
        
        // Create and bind vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        // Create and bind texture coordinate buffer
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
        
        // Create and bind index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        
        // Store number of indices
        this.numIndices = indices.length;
    }
    
    // Set position
    setPosition(x, y, z) {
        this.modelMatrix.setTranslate(x, y, z);
        return this;
    }
    
    // Set scale
    setScale(sx, sy, sz) {
        this.modelMatrix.scale(sx, sy, sz);
        return this;
    }
    
    // Render the cube
    render(gl, program, viewMatrix, projectionMatrix, textureMode) {
        // Set model matrix
        const u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.modelMatrix.elements);
        
        // Set view and projection matrices
        const u_ViewMatrix = gl.getUniformLocation(program, 'u_ViewMatrix');
        const u_ProjectionMatrix = gl.getUniformLocation(program, 'u_ProjectionMatrix');
        gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
        gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);
        
        // Set texture mode (0 = base color, 1 = texture)
        const u_texColorWeight = gl.getUniformLocation(program, 'u_texColorWeight');
        gl.uniform1f(u_texColorWeight, textureMode);
        
        // Set up attributes
        const a_Position = gl.getAttribLocation(program, 'a_Position');
        const a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
        
        // Bind vertex and attribute buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_TexCoord);
        
        // Draw the cube
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
    }
}