// Define fragment shader as a string
const fragmentShaderSource = `
    precision mediump float;
    
    varying vec4 v_color; // Keep for now (optional)
    varying vec2 v_texCoord; // Receive texture coordinates from vertex shader
    
    uniform sampler2D u_texture; // Texture sampler uniform
    uniform bool u_useTexture;   // Flag to control whether to use texture or color
    
    void main() {
        if (u_useTexture) {
            gl_FragColor = texture2D(u_texture, v_texCoord);
        } else {
            gl_FragColor = v_color; // Fallback to vertex color if not using texture
        }
    }
`;