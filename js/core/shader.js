class Shader {
    constructor(gl) {
        this.gl = gl;
        this.program = null;
        this.uniforms = {};
    }
    
    /**
     * Compile shader program from source code
     * @param {string} vsSource - Vertex shader source
     * @param {string} fsSource - Fragment shader source
     * @returns {boolean} - Success status
     */
    compile(vsSource, fsSource) {
        const gl = this.gl;
        
        // Create shaders
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
        
        if (!vertexShader || !fragmentShader) {
            return false;
        }
        
        // Create program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        // Check for linking errors
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Failed to link program:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return false;
        }
        
        this.program = program;
        
        // Cache uniform locations
        this.cacheUniforms();
        
        return true;
    }
    
    /**
     * Compile individual shader
     * @param {number} type - Shader type (VERTEX_SHADER or FRAGMENT_SHADER)
     * @param {string} source - Shader source code
     * @returns {WebGLShader|null} - Compiled shader or null on failure
     */
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        // Check for compilation errors
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(
                'Failed to compile shader:',
                gl.getShaderInfoLog(shader)
            );
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    /**
     * Cache uniform locations for faster access
     */
    cacheUniforms() {
        const gl = this.gl;
        const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        
        for (let i = 0; i < numUniforms; i++) {
            const uniformInfo = gl.getActiveUniform(this.program, i);
            const location = gl.getUniformLocation(this.program, uniformInfo.name);
            this.uniforms[uniformInfo.name] = location;
        }
    }
    
    /**
     * Use this shader program
     */
    use() {
        this.gl.useProgram(this.program);
    }
    
    /**
     * Set a matrix4 uniform
     * @param {string} name - Uniform name
     * @param {Float32Array} value - Matrix data
     */
    setMatrix4(name, value) {
        const location = this.uniforms[name] || this.gl.getUniformLocation(this.program, name);
        this.gl.uniformMatrix4fv(location, false, value);
    }
    
    /**
     * Set a float uniform
     * @param {string} name - Uniform name
     * @param {number} value - Float value
     */
    setFloat(name, value) {
        const location = this.uniforms[name] || this.gl.getUniformLocation(this.program, name);
        this.gl.uniform1f(location, value);
    }
    
    /**
     * Set a vec3 uniform
     * @param {string} name - Uniform name
     * @param {Float32Array|Array<number>} value - Vector data
     */
    setVec3(name, value) {
        const location = this.uniforms[name] || this.gl.getUniformLocation(this.program, name);
        this.gl.uniform3fv(location, value);
    }
    
    /**
     * Get attribute location
     * @param {string} name - Attribute name
     * @returns {number} - Attribute location
     */
    getAttribLocation(name) {
        return this.gl.getAttribLocation(this.program, name);
    }
}