precision mediump float;

uniform sampler2D u_Sampler;
uniform float u_texColorWeight;
uniform vec4 u_baseColor;
uniform vec2 u_TexScale;

// Lighting uniforms
uniform bool u_lightingEnabled;
uniform bool u_normalVisualization;
uniform vec3 u_LightColor;
uniform vec3 u_LightPos;
uniform vec3 u_SpotLightPos;
uniform vec3 u_SpotLightDir;
uniform float u_SpotLightCutoff;
uniform bool u_pointLightEnabled;
uniform bool u_spotLightEnabled;

// Enhanced sun lighting uniforms
uniform vec3 u_SunColor;
uniform float u_SunIntensity;
uniform vec3 u_AmbientColor;
uniform vec3 u_CameraPos;

varying vec2 v_TexCoord;
varying vec3 v_WorldPos;
varying vec3 v_Normal;
varying vec3 v_LightDir;
varying vec3 v_ViewDir;

void main() {
    // Normal visualization mode
    if (u_normalVisualization) {
        gl_FragColor = vec4(normalize(v_Normal) * 0.5 + 0.5, 1.0);
        return;
    }
    
    // Get base color from texture or base color
    vec2 scaledTexCoord = v_TexCoord * u_TexScale;
    vec4 texColor = texture2D(u_Sampler, scaledTexCoord);
    vec4 materialColor = mix(u_baseColor, texColor, u_texColorWeight);
    
    if (!u_lightingEnabled) {
        gl_FragColor = materialColor;
        return;
    }
    
    // Normalize vectors
    vec3 normal = normalize(v_Normal);
    vec3 lightDir = normalize(v_LightDir);
    vec3 viewDir = normalize(v_ViewDir);
    
    // Enhanced ambient lighting for bright daytime feel
    vec3 ambient = u_AmbientColor;
    vec3 finalColor = ambient * materialColor.rgb;
    
    // Point light contribution
    if (u_pointLightEnabled && dot(normal, lightDir) > 0.0) {
        // Diffuse component
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * u_LightColor;
        
        // Specular component
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        vec3 specular = spec * u_LightColor * 0.5;
        
        finalColor += (diffuse + specular) * materialColor.rgb;
    }
    
    // ENHANCED: Powerful sun spot light contribution
    if (u_spotLightEnabled) {
        vec3 spotLightDir = normalize(u_SpotLightPos - v_WorldPos);
        float spotAngle = dot(spotLightDir, normalize(-u_SpotLightDir));
        
        if (spotAngle > u_SpotLightCutoff && dot(normal, spotLightDir) > 0.0) {
            // Smooth falloff from center to edge of spotlight cone
            float intensity = (spotAngle - u_SpotLightCutoff) / (1.0 - u_SpotLightCutoff);
            intensity = pow(clamp(intensity, 0.0, 1.0), 0.5); // Softer falloff curve
            
            // Enhanced sun lighting with much higher intensity
            float sunDiffuse = max(dot(normal, spotLightDir), 0.0);
            vec3 sunColor = u_SunColor * u_SunIntensity; // Apply intensity multiplier
            vec3 diffuse = sunDiffuse * sunColor * intensity;
            
            // Brighter specular highlights from the sun
            vec3 reflectDir = reflect(-spotLightDir, normal);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0); // Slightly softer specular
            vec3 specular = spec * sunColor * intensity * 0.8; // Stronger specular from sun
            
            // Distance attenuation (very gentle for the distant sun)
            float distance = length(u_SpotLightPos - v_WorldPos);
            float attenuation = 1.0 / (1.0 + 0.0001 * distance + 0.000001 * distance * distance);
            
            finalColor += (diffuse + specular) * materialColor.rgb * attenuation;
        }
    }
    
    // Tone mapping for bright lighting (optional, prevents overexposure)
    finalColor = finalColor / (finalColor + vec3(1.0));
    finalColor = pow(finalColor, vec3(1.0/2.2)); // Gamma correction
    
    gl_FragColor = vec4(finalColor, materialColor.a);
}