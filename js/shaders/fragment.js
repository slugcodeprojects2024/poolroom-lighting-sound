// Define fragment shader as a string
const fragmentShaderSource = `
    precision mediump float;
    
    varying vec4 v_color;
    
    void main() {
        gl_FragColor = v_color;
    }
`;