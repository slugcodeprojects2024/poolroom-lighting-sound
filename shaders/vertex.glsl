// Vertex Shader
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
varying vec2 v_TexCoord;

void main() {
    // Calculate the final position using all three matrices
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    
    // Pass texture coordinates to fragment shader
    v_TexCoord = a_TexCoord;
}