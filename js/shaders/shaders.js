// Define vertex shader as a string
const vertexShaderSource = `
    precision mediump float;
    
    attribute vec4 a_position;
    attribute vec4 a_color;
    
    uniform mat4 u_modelMatrix;
    uniform mat4 u_viewMatrix;
    uniform mat4 u_projectionMatrix;
    
    varying vec4 v_color;
    
    void main() {
        gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * a_position;
        v_color = a_color;
    }
`;

// Define fragment shader as a string
const fragmentShaderSource = `
    precision mediump float;
    
    varying vec4 v_color;
    
    void main() {
        gl_FragColor = v_color;
    }
`;