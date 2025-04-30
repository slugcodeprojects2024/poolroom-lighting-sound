// Define vertex shader as a string
const vertexShaderSource = `
    attribute vec4 a_position;
    attribute vec4 a_color; // Keep for now, can be removed if only using textures
    attribute vec2 a_texCoord; // Added texture coordinate attribute
    
    uniform mat4 u_modelMatrix;
    uniform mat4 u_viewMatrix;
    uniform mat4 u_projectionMatrix;
    
    varying vec4 v_color; // Keep for now
    varying vec2 v_texCoord; // Pass texture coordinates to fragment shader
    
    void main() {
        // Calculate final position
        gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * a_position;
        
        // Pass color and texture coordinates to fragment shader
        v_color = a_color; // Pass color (optional)
        v_texCoord = a_texCoord; // Pass texture coordinates
    }
`;