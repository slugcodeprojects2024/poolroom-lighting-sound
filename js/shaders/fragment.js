// Define fragment shader as a string
const fragmentShaderSource = `
    precision mediump float;
    
    varying vec4 v_color;
    varying vec2 v_texCoord;
    varying vec3 v_worldPosition;
    
    uniform int u_blockType; // 0 = default, 1 = water, 2 = tile, 3 = wall
    uniform float u_time;    // For animations
    
    void main() {
        vec4 color = v_color;
        
        // Handle different block types
        if (u_blockType == 1) {
            // Water effects
            float waveX = sin(v_worldPosition.x * 4.0 + u_time * 0.5) * 0.05;
            float waveZ = cos(v_worldPosition.z * 4.0 + u_time * 0.5) * 0.05;
            
            // Add wave effect to color
            color.rgb += vec3(waveX + waveZ);
            
            // Add subtle ripple patterns
            float ripple = 
                sin(v_worldPosition.x * 10.0 + u_time) * 
                sin(v_worldPosition.z * 10.0 + u_time) * 0.02;
            color.rgb += vec3(ripple);
            
            // Adjust transparency for depth effect
            color.a = 0.7;
        } 
        else if (u_blockType == 2) {
            // Tile - add some variation based on position
            float brightness = 
                0.95 + 0.05 * sin(v_worldPosition.x * 8.0) * 
                sin(v_worldPosition.z * 8.0);
            
            // Add subtle grid pattern
            float gridX = mod(v_worldPosition.x + 0.5, 1.0);
            float gridZ = mod(v_worldPosition.z + 0.5, 1.0);
            
            // Create grid lines
            if (gridX < 0.05 || gridX > 0.95 || gridZ < 0.05 || gridZ > 0.95) {
                brightness *= 0.9; // Darker grid lines
            }
            
            color.rgb *= brightness;
        }
        else if (u_blockType == 3) {
            // Wall - add subtle texture
            float noise = 
                fract(sin(dot(v_worldPosition.xz, vec2(12.9898, 78.233))) * 43758.5453) * 0.1;
            
            color.rgb *= (0.95 + noise);
        }
        
        gl_FragColor = color;
    }
`;