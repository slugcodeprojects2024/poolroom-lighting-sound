// Define fragment shader as a string
const fragmentShaderSource = `
    precision mediump float;
    
    varying vec4 v_color;
    varying vec2 v_texCoord;
    varying vec3 v_worldPosition;
    
    uniform int u_blockType; // 0 = default, 1 = water, 2 = tile
    uniform float u_time;    // For water animation
    
    void main() {
        vec4 color = v_color;
        
        // Handle different block types
        if (u_blockType == 1) {
            // Water
            float waveX = sin(v_worldPosition.x * 4.0 + u_time * 0.5) * 0.05;
            float waveZ = cos(v_worldPosition.z * 4.0 + u_time * 0.5) * 0.05;
            
            // Add wave effect to color
            color.rgb += vec3(waveX + waveZ);
            
            // Water transparency
            color.a = 0.7;
        } else if (u_blockType == 2) {
            // Tile - add some variation based on position
            float brightness = 
                0.9 + 0.1 * sin(v_worldPosition.x * 5.0) * 
                sin(v_worldPosition.y * 5.0) * 
                sin(v_worldPosition.z * 5.0);
            
            color.rgb *= brightness;
        }
        
        gl_FragColor = color;
    }
`;