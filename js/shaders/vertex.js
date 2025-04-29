// Define vertex shader as a string
const vertexShaderSource = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    attribute vec2 a_texCoord;
    
    uniform mat4 u_modelMatrix;
    uniform mat4 u_viewMatrix;
    uniform mat4 u_projectionMatrix;
    
    varying vec4 v_color;
    varying vec2 v_texCoord;
    varying vec3 v_worldPosition;
    
    void main() {
        // Calculate world position
        vec4 worldPosition = u_modelMatrix * a_position;
        v_worldPosition = worldPosition.xyz;
        
        // Calculate final position
        gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
        
        // Pass color and texture coordinates to fragment shader
        v_color = a_color;
        v_texCoord = a_texCoord;
    }
`;