// Define vertex shader as a string
const vertexShaderSource = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    attribute vec2 a_texCoord;
    
    uniform mat4 u_modelMatrix;
    uniform mat4 u_viewMatrix;
    uniform mat4 u_projectionMatrix;
    uniform int u_blockType; // 0 = default, 1 = water, 2 = tile, 3 = wall
    uniform float u_time;    // For animations
    
    varying vec4 v_color;
    varying vec2 v_texCoord;
    varying vec3 v_worldPosition;
    
    void main() {
        // Apply model matrix to get world position
        vec4 worldPosition = u_modelMatrix * a_position;
        
        // Apply water animation if this is a water block
        if (u_blockType == 1) {
            // Only animate the top face of water (y is 0.5 at the top)
            if (a_position.y > 0.4) {
                // Water wave effect
                float waveX = sin(worldPosition.x * 3.0 + u_time * 1.5) * 0.03;
                float waveZ = cos(worldPosition.z * 3.0 + u_time * 1.5) * 0.03;
                worldPosition.y += waveX + waveZ;
            }
        }
        
        // Pass world position to fragment shader
        v_worldPosition = worldPosition.xyz;
        
        // Calculate clip space position
        gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
        
        // Pass color and texture coordinates to fragment shader
        v_color = a_color;
        v_texCoord = a_texCoord;
    }
`;