// objLoader.js - Fixed version with proper exports
class OBJLoader {
    constructor(filePath) {
        this.filePath = filePath;
        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.faces = [];
        this.isFullyLoaded = false;
        this.modelData = null;
    }
    
    // Parse the OBJ file asynchronously
    async parseModel() {
        try {
            const response = await fetch(this.filePath);
            const text = await response.text();
            
            const lines = text.split('\n');
            
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const type = parts[0];
                
                switch (type) {
                    case 'v': // Vertex position
                        this.vertices.push([
                            parseFloat(parts[1]),
                            parseFloat(parts[2]),
                            parseFloat(parts[3])
                        ]);
                        break;
                        
                    case 'vn': // Vertex normal
                        this.normals.push([
                            parseFloat(parts[1]),
                            parseFloat(parts[2]),
                            parseFloat(parts[3])
                        ]);
                        break;
                        
                    case 'vt': // Texture coordinate
                        this.texCoords.push([
                            parseFloat(parts[1]),
                            parseFloat(parts[2])
                        ]);
                        break;
                        
                    case 'f': // Face
                        const face = [];
                        for (let i = 1; i < parts.length; i++) {
                            const indices = parts[i].split('/');
                            face.push({
                                vertex: parseInt(indices[0]) - 1, // OBJ uses 1-based indexing
                                texCoord: indices[1] ? parseInt(indices[1]) - 1 : null,
                                normal: indices[2] ? parseInt(indices[2]) - 1 : null
                            });
                        }
                        this.faces.push(face);
                        break;
                }
            }
            
            this.isFullyLoaded = true;
            console.log(`OBJ loaded: ${this.vertices.length} vertices, ${this.faces.length} faces`);
        } catch (error) {
            console.error('Error loading OBJ file:', error);
        }
    }
    
    // Get model data in the format expected by WebGL
    getModelData() {
        if (!this.isFullyLoaded) {
            return { vertices: [], normals: [], texCoords: [] };
        }
        
        const vertices = [];
        const normals = [];
        const texCoords = [];
        
        // Convert face data to vertex arrays
        for (const face of this.faces) {
            // Triangulate face if it has more than 3 vertices
            for (let i = 1; i < face.length - 1; i++) {
                const indices = [0, i, i + 1];
                
                for (const idx of indices) {
                    const vertex = face[idx];
                    
                    // Add vertex position
                    const pos = this.vertices[vertex.vertex];
                    vertices.push(pos[0], pos[1], pos[2]);
                    
                    // Add normal (generate if not provided)
                    if (vertex.normal !== null && this.normals[vertex.normal]) {
                        const norm = this.normals[vertex.normal];
                        normals.push(norm[0], norm[1], norm[2]);
                    } else {
                        // Calculate face normal if vertex normals not provided
                        const faceNormal = this.calculateFaceNormal(face);
                        normals.push(faceNormal[0], faceNormal[1], faceNormal[2]);
                    }
                    
                    // Add texture coordinates (if available)
                    if (vertex.texCoord !== null && this.texCoords[vertex.texCoord]) {
                        const tex = this.texCoords[vertex.texCoord];
                        texCoords.push(tex[0], tex[1]);
                    } else {
                        texCoords.push(0.0, 0.0); // Default UV
                    }
                }
            }
        }
        
        this.modelData = {
            vertices: vertices,
            normals: normals,
            texCoords: texCoords
        };
        
        return this.modelData;
    }
    
    // Calculate normal for a face
    calculateFaceNormal(face) {
        if (face.length < 3) return [0, 1, 0]; // Default up normal
        
        const v0 = this.vertices[face[0].vertex];
        const v1 = this.vertices[face[1].vertex];
        const v2 = this.vertices[face[2].vertex];
        
        // Calculate two edge vectors
        const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
        
        // Calculate cross product
        const normal = [
            edge1[1] * edge2[2] - edge1[2] * edge2[1],
            edge1[2] * edge2[0] - edge1[0] * edge2[2],
            edge1[0] * edge2[1] - edge1[1] * edge2[0]
        ];
        
        // Normalize
        const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
        if (length > 0) {
            normal[0] /= length;
            normal[1] /= length;
            normal[2] /= length;
        }
        
        return normal;
    }
}

// Model class for rendering OBJ files with lighting
class Model {
    constructor(gl, filePath) {
        this.gl = gl;
        this.filePath = filePath;
        this.color = [1.0, 1.0, 1.0, 1.0]; // Default white
        this.modelMatrix = new Matrix4();
        
        this.vertexBuffer = null;
        this.normalBuffer = null;
        this.texCoordBuffer = null;
        this.numVertices = 0;
        
        // Initialize OBJ loader
        this.loader = new OBJLoader(filePath);
        
        // Load the model
        this.loader.parseModel().then(() => {
            const modelData = this.loader.getModelData();
            
            if (modelData.vertices.length === 0) {
                console.error('No vertex data loaded from OBJ file');
                return;
            }
            
            this.createBuffers(modelData);
            console.log(`Model loaded: ${this.numVertices} vertices`);
        }).catch(error => {
            console.error('Error loading model:', error);
        });
    }
    
    // Create WebGL buffers from model data
    createBuffers(modelData) {
        const gl = this.gl;
        
        this.numVertices = modelData.vertices.length / 3;
        
        // Create vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.vertices), gl.STATIC_DRAW);
        
        // Create normal buffer
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.normals), gl.STATIC_DRAW);
        
        // Create texture coordinate buffer
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.texCoords), gl.STATIC_DRAW);
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
    
    // Set rotation
    setRotation(angle, x, y, z) {
        this.modelMatrix.rotate(angle, x, y, z);
        return this;
    }
    
    // Set color
    setColor(r, g, b, a = 1.0) {
        this.color = [r, g, b, a];
        return this;
    }
    
    // Render the model
    render(gl, program, viewMatrix, projectionMatrix, lightingSystem = null) {
        // Skip rendering if not loaded yet
        if (!this.loader.isFullyLoaded || !this.vertexBuffer) {
            return;
        }
        
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
        
        // Set color and texture properties
        const u_baseColor = gl.getUniformLocation(program, 'u_baseColor');
        const u_texColorWeight = gl.getUniformLocation(program, 'u_texColorWeight');
        const u_TexScale = gl.getUniformLocation(program, 'u_TexScale');
        
        gl.uniform4fv(u_baseColor, this.color);
        gl.uniform1f(u_texColorWeight, 0.8); // Blend texture with base color
        gl.uniform2f(u_TexScale, 1.0, 1.0);
        
        // Set up attributes
        const a_Position = gl.getAttribLocation(program, 'a_Position');
        const a_Normal = gl.getAttribLocation(program, 'a_Normal');
        const a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
        
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
        
        // Draw the model
        gl.drawArrays(gl.TRIANGLES, 0, this.numVertices);
    }
}

// Export both classes
export { OBJLoader, Model };