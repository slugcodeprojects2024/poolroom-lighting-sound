// Updated Cube class with normal support
export class CubeWithNormals {
    constructor(gl) {
        this.gl = gl;
        this.vertexBuffer = null;
        this.texCoordBuffer = null;
        this.normalBuffer = null;
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
            -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
            // Back face
            -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
            // Top face
            -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
            // Bottom face
            -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
            // Right face
             0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
            // Left face
            -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5
        ]);
        
        // Normal vectors for each face
        const normals = new Float32Array([
            // Front face (positive Z)
             0.0,  0.0,  1.0,   0.0,  0.0,  1.0,   0.0,  0.0,  1.0,   0.0,  0.0,  1.0,
            // Back face (negative Z)
             0.0,  0.0, -1.0,   0.0,  0.0, -1.0,   0.0,  0.0, -1.0,   0.0,  0.0, -1.0,
            // Top face (positive Y)
             0.0,  1.0,  0.0,   0.0,  1.0,  0.0,   0.0,  1.0,  0.0,   0.0,  1.0,  0.0,
            // Bottom face (negative Y)
             0.0, -1.0,  0.0,   0.0, -1.0,  0.0,   0.0, -1.0,  0.0,   0.0, -1.0,  0.0,
            // Right face (positive X)
             1.0,  0.0,  0.0,   1.0,  0.0,  0.0,   1.0,  0.0,  0.0,   1.0,  0.0,  0.0,
            // Left face (negative X)
            -1.0,  0.0,  0.0,  -1.0,  0.0,  0.0,  -1.0,  0.0,  0.0,  -1.0,  0.0,  0.0
        ]);
        
        // Texture coordinates
        const texCoords = new Float32Array([
            // Front face
            0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
            // Back face
            1.0, 0.0,  1.0, 1.0,  0.0, 1.0,  0.0, 0.0,
            // Top face
            0.0, 1.0,  0.0, 0.0,  1.0, 0.0,  1.0, 1.0,
            // Bottom face
            1.0, 1.0,  0.0, 1.0,  0.0, 0.0,  1.0, 0.0,
            // Right face
            1.0, 0.0,  1.0, 1.0,  0.0, 1.0,  0.0, 0.0,
            // Left face
            0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0
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
        
        // Create and bind normal buffer
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
        
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
    
    // Render the cube with lighting support
    render(gl, program, viewMatrix, projectionMatrix, textureMode, lightingSystem = null) {
        // Set model matrix
        const u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.modelMatrix.elements);
        
        // Set view and projection matrices
        const u_ViewMatrix = gl.getUniformLocation(program, 'u_ViewMatrix');
        const u_ProjectionMatrix = gl.getUniformLocation(program, 'u_ProjectionMatrix');
        gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
        gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);
        
        // Calculate and set normal matrix
        if (lightingSystem) {
            const normalMatrix = lightingSystem.calculateNormalMatrix(this.modelMatrix);
            const u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
            gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
        }
        
        // Set texture mode
        const u_texColorWeight = gl.getUniformLocation(program, 'u_texColorWeight');
        gl.uniform1f(u_texColorWeight, textureMode);
        
        // Set up attributes
        const a_Position = gl.getAttribLocation(program, 'a_Position');
        const a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
        const a_Normal = gl.getAttribLocation(program, 'a_Normal');
        
        // Bind and set vertex attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_TexCoord);
        
        // Draw the cube
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
    }
}

// Sphere class with procedural generation and normals
export class Sphere {
    constructor(gl, radius = 0.5, segments = 16) {
        this.gl = gl;
        this.radius = radius;
        this.segments = segments;
        this.vertexBuffer = null;
        this.texCoordBuffer = null;
        this.normalBuffer = null;
        this.indexBuffer = null;
        this.numIndices = 0;
        
        // Model matrix for this sphere
        this.modelMatrix = new Matrix4();
        
        // Initialize buffers
        this.initBuffers();
    }
    
    initBuffers() {
        const gl = this.gl;
        const vertices = [];
        const normals = [];
        const texCoords = [];
        const indices = [];
        
        // Generate sphere vertices using spherical coordinates
        for (let lat = 0; lat <= this.segments; lat++) {
            const theta = lat * Math.PI / this.segments; // 0 to PI
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let lon = 0; lon <= this.segments; lon++) {
                const phi = lon * 2 * Math.PI / this.segments; // 0 to 2PI
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                // Calculate vertex position
                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;
                
                // Vertex position (scaled by radius)
                vertices.push(x * this.radius, y * this.radius, z * this.radius);
                
                // Normal vector (for sphere centered at origin, normal = position)
                normals.push(x, y, z);
                
                // Texture coordinates
                const u = 1 - (lon / this.segments);
                const v = 1 - (lat / this.segments);
                texCoords.push(u, v);
            }
        }
        
        // Generate indices for triangles
        for (let lat = 0; lat < this.segments; lat++) {
            for (let lon = 0; lon < this.segments; lon++) {
                const first = (lat * (this.segments + 1)) + lon;
                const second = first + this.segments + 1;
                
                // First triangle
                indices.push(first, second, first + 1);
                // Second triangle
                indices.push(second, second + 1, first + 1);
            }
        }
        
        // Create and bind vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        
        // Create and bind normal buffer
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        
        // Create and bind texture coordinate buffer
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
        
        // Create and bind index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        
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
    
    // Render the sphere
    render(gl, program, viewMatrix, projectionMatrix, textureMode, lightingSystem = null) {
        // Set model matrix
        const u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.modelMatrix.elements);
        
        // Set view and projection matrices
        const u_ViewMatrix = gl.getUniformLocation(program, 'u_ViewMatrix');
        const u_ProjectionMatrix = gl.getUniformLocation(program, 'u_ProjectionMatrix');
        gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
        gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);
        
        // Calculate and set normal matrix
        if (lightingSystem) {
            const normalMatrix = lightingSystem.calculateNormalMatrix(this.modelMatrix);
            const u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
            gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
        }
        
        // Set texture mode
        const u_texColorWeight = gl.getUniformLocation(program, 'u_texColorWeight');
        gl.uniform1f(u_texColorWeight, textureMode);
        
        // Set up attributes
        const a_Position = gl.getAttribLocation(program, 'a_Position');
        const a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
        const a_Normal = gl.getAttribLocation(program, 'a_Normal');
        
        // Bind and set vertex attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_TexCoord);
        
        // Draw the sphere
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
    }
}