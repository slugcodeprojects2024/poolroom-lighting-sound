// Define vertex shader as a string
const vertexShaderSource = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    
    uniform mat4 u_modelMatrix;
    uniform mat4 u_viewMatrix;
    uniform mat4 u_projectionMatrix;
    
    varying vec4 v_color;
    
    void main() {
        // Calculate final position
        gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * a_position;
        
        // Pass color to fragment shader
        v_color = a_color;
    }
`;