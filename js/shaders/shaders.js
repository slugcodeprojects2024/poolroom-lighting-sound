// Define vertex shader as a string
const vertexShaderSource = `
    precision mediump float;
    
    attribute vec4 a_position;
    attribute vec4 a_color;
    attribute vec2 a_texCoord;
    
    uniform mat4 u_modelMatrix;
    uniform mat4 u_viewMatrix;
    uniform mat4 u_projectionMatrix;
    uniform int u_blockType;  // 0 = default, 1 = water, 2 = tile, 3 = wall
    uniform float u_time;     // For animations
    
    varying vec4 v_color;
    varying vec2 v_texCoord;
    varying vec3 v_worldPosition;
    
    void main() {
        // Apply model matrix to get world position
        vec4 worldPosition = u_modelMatrix * a_position;
        
        // Pass world position to fragment shader
        v_worldPosition = worldPosition.xyz;
        
        // Calculate clip space position
        gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
        
        // Pass color and texture coordinates to fragment shader
        v_color = a_color;
        v_texCoord = a_texCoord;
    }
`;

// Define fragment shader as a string
const fragmentShaderSource = `
    precision mediump float;
    
    varying vec4 v_color;
    varying vec2 v_texCoord;
    varying vec3 v_worldPosition;
    
    uniform int u_blockType;  // 0 = default, 1 = water, 2 = tile, 3 = wall
    uniform float u_time;     // For animations
    
    void main() {
        gl_FragColor = v_color;
    }
`;