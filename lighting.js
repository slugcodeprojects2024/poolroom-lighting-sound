// lighting.js - Complete lighting system with sun integration
export class LightingSystem {
    constructor(gl) {
        this.gl = gl;
        
        // Lighting state
        this.lightingEnabled = true;
        this.normalVisualization = false;
        this.pointLightEnabled = true;
        this.spotLightEnabled = true;
        
        // Point light properties (moving light for Assignment 4)
        this.pointLightPos = [16, 3, 16];
        this.lightColor = [1.0, 1.0, 1.0];
        this.lightMovementSpeed = 2.0;
        this.lightAnimationTime = 0;
        
        // NEW: Point light movement controls
        this.pointLightMoving = true; // Toggle for movement
        this.pointLightSpeed = 2.0;   // Adjustable speed
        this.pointLightRadius = 8.0;  // Movement radius
        
        // ENHANCED: Powerful fixed sun spotlight
        this.sunPosition = [16, 80, 16]; // Very high in the sky, fixed position
        this.spotLightPos = this.sunPosition.slice();
        this.spotLightDir = [0, -1, 0]; // Points straight down from sun
        this.spotLightCutoff = Math.cos(Math.PI / 4); // 45 degree cone (wider beam)
        this.sunColor = [3.0, 2.8, 2.5]; // Much brighter warm sunlight (3x intensity)
        this.sunIntensity = 2.5; // Additional intensity multiplier
        
        // Sun rotation (slow and optional)
        this.sunRotationEnabled = true;
        this.sunRotationSpeed = 0.01; // Very slow rotation
        this.sunRotationRadius = 5.0; // Small radius around center
        
        // Enhanced ambient lighting for bright daytime feel
        this.ambientColor = [0.4, 0.4, 0.45]; // Brighter ambient light
        
        // Light markers
        this.lightMarker = null;
        this.spotLightMarker = null;
        
        // Create UI controls
        this.createUI();
    }
    
    // Initialize light markers
    initLightMarkers(CubeClass) {
        // Point light marker (white moving light)
        this.lightMarker = new CubeClass(this.gl);
        this.lightMarker.setScale(0.3, 0.3, 0.3);
        this.lightMarker.type = 'lightMarker';
        
        // Sun marker (large golden sun in sky) - much larger and brighter
        this.spotLightMarker = new CubeClass(this.gl);
        this.spotLightMarker.setScale(8.0, 8.0, 8.0); // Larger sun marker
        this.spotLightMarker.type = 'sunMarker';
    }
    
    // Update lighting system
    update(deltaTime) {
        // Update point light animation only if movement is enabled
        if (this.pointLightMoving) {
            this.lightAnimationTime += deltaTime * this.pointLightSpeed;
            
            // Circular movement around the pool center
            this.pointLightPos[0] = 16 + Math.cos(this.lightAnimationTime) * this.pointLightRadius;
            this.pointLightPos[2] = 16 + Math.sin(this.lightAnimationTime) * this.pointLightRadius;
        }
        
        // Update point light marker
        if (this.lightMarker) {
            this.lightMarker.modelMatrix.setIdentity();
            this.lightMarker.modelMatrix.setTranslate(
                this.pointLightPos[0],
                this.pointLightPos[1],
                this.pointLightPos[2]
            );
            this.lightMarker.modelMatrix.scale(0.3, 0.3, 0.3);
        }
        
        // Optional: Very slow sun rotation for dynamic shadows
        if (this.sunRotationEnabled) {
            this.sunPosition[0] = 16 + Math.cos(this.lightAnimationTime * this.sunRotationSpeed) * this.sunRotationRadius;
            this.sunPosition[2] = 16 + Math.sin(this.lightAnimationTime * this.sunRotationSpeed) * this.sunRotationRadius;
            this.spotLightPos = this.sunPosition.slice();
        }
        
        // Update sun marker with bright glow effect
        if (this.spotLightMarker) {
            this.spotLightMarker.modelMatrix.setIdentity();
            this.spotLightMarker.modelMatrix.setTranslate(
                this.sunPosition[0],
                this.sunPosition[1],
                this.sunPosition[2]
            );
            
            // Bright pulsing glow effect
            const glowScale = 6.0 + 2.0 * Math.sin(this.lightAnimationTime * 1.5);
            this.spotLightMarker.modelMatrix.scale(glowScale, glowScale, glowScale);
        }
    }
    
    // Set lighting uniforms in shader
    setUniforms(gl, program, camera) {
        // Basic lighting state
        const u_lightingEnabled = gl.getUniformLocation(program, 'u_lightingEnabled');
        const u_normalVisualization = gl.getUniformLocation(program, 'u_normalVisualization');
        gl.uniform1i(u_lightingEnabled, this.lightingEnabled);
        gl.uniform1i(u_normalVisualization, this.normalVisualization);
        
        // Light enables
        const u_pointLightEnabled = gl.getUniformLocation(program, 'u_pointLightEnabled');
        const u_spotLightEnabled = gl.getUniformLocation(program, 'u_spotLightEnabled');
        gl.uniform1i(u_pointLightEnabled, this.pointLightEnabled);
        gl.uniform1i(u_spotLightEnabled, this.spotLightEnabled);
        
        // Dynamic ambient lighting based on sun state
        const currentAmbient = this.spotLightEnabled ? this.ambientColor[0] : this.ambientColor[0];
        const u_AmbientStrength = gl.getUniformLocation(program, 'u_AmbientStrength');
        gl.uniform1f(u_AmbientStrength, currentAmbient);
        
        // Point light properties
        const u_LightPos = gl.getUniformLocation(program, 'u_LightPos');
        const u_LightColor = gl.getUniformLocation(program, 'u_LightColor');
        gl.uniform3fv(u_LightPos, this.pointLightPos);
        gl.uniform3fv(u_LightColor, this.lightColor);
        
        // Enhanced sun-based spot light properties
        const u_SpotLightPos = gl.getUniformLocation(program, 'u_SpotLightPos');
        const u_SpotLightDir = gl.getUniformLocation(program, 'u_SpotLightDir');
        const u_SpotLightCutoff = gl.getUniformLocation(program, 'u_SpotLightCutoff');
        const u_SunColor = gl.getUniformLocation(program, 'u_SunColor');
        const u_SunIntensity = gl.getUniformLocation(program, 'u_SunIntensity');
        const u_AmbientColor = gl.getUniformLocation(program, 'u_AmbientColor');
        
        gl.uniform3fv(u_SpotLightPos, this.spotLightPos);
        gl.uniform3fv(u_SpotLightDir, this.spotLightDir);
        gl.uniform1f(u_SpotLightCutoff, this.spotLightCutoff);
        
        // Enhanced sun lighting uniforms
        if (u_SunColor) gl.uniform3fv(u_SunColor, this.sunColor);
        if (u_SunIntensity) gl.uniform1f(u_SunIntensity, this.sunIntensity);
        if (u_AmbientColor) gl.uniform3fv(u_AmbientColor, this.ambientColor);
        
        // Camera position for specular calculations
        const u_CameraPos = gl.getUniformLocation(program, 'u_CameraPos');
        gl.uniform3fv(u_CameraPos, camera.position.elements);
    }
    
    // Calculate normal matrix for proper lighting
    calculateNormalMatrix(modelMatrix) {
        const normalMatrix = new Matrix4();
        normalMatrix.set(modelMatrix);
        return normalMatrix;
    }
    
    // Create UI controls
    createUI() {
        const controlsDiv = document.createElement('div');
        controlsDiv.id = 'lighting-controls';
        controlsDiv.style.cssText = `
            position: absolute;
            top: 150px;
            left: 10px;
            background: rgba(0,0,0,0.85);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            min-width: 280px;
            backdrop-filter: blur(5px);
        `;
        
        controlsDiv.innerHTML = `
            <h3 style="margin-top: 0; color: #ffd700;">☀️ Assignment 4 Lighting</h3>
            
            <div style="margin: 10px 0;">
                <button id="toggle-lighting" style="padding: 8px 12px; margin-right: 5px; background: #4CAF50; color: white; border: none; border-radius: 4px;">Toggle Lighting (L)</button>
                <button id="toggle-normals" style="padding: 8px 12px; background: #2196F3; color: white; border: none; border-radius: 4px;">Toggle Normals (N)</button>
            </div>
            
            <div style="margin: 15px 0; padding: 10px; background: rgba(255,255,0,0.2); border-radius: 5px;">
                <h4 style="margin-top: 0; color: #ffff00;">💡 Point Light (Moving)</h4>
                <label><input type="checkbox" id="point-light-toggle" checked> Enable Point Light</label><br>
                <label><input type="checkbox" id="point-light-movement" checked> Enable Movement</label><br>
                <label style="display: block; margin-top: 8px;">Speed: <input type="range" id="point-light-speed" min="0.5" max="5.0" value="2.0" step="0.1" style="width: 140px;"></label>
                <label style="display: block;">X: <input type="range" id="light-x" min="5" max="27" value="16" step="0.5" style="width: 140px;"></label>
                <label style="display: block;">Y: <input type="range" id="light-y" min="1" max="8" value="3" step="0.2" style="width: 140px;"></label>
                <label style="display: block;">Z: <input type="range" id="light-z" min="5" max="27" value="16" step="0.5" style="width: 140px;"></label>
            </div>
            
            <div style="margin: 15px 0; padding: 10px; background: rgba(255,215,0,0.3); border-radius: 5px; border: 2px solid #ffd700;">
                <h4 style="margin-top: 0; color: #ffd700;">SUN LIGHTING</h4>
                <label><input type="checkbox" id="spot-light-toggle" checked> Enable Sun Light</label><br>
                <label><input type="checkbox" id="sun-rotation-toggle" checked> Slow Rotation</label><br>
                <label style="display: block; margin-top: 8px;">Sun Intensity: <input type="range" id="sun-intensity" min="1.0" max="5.0" value="2.5" step="0.1" style="width: 140px;"></label>
                <label style="display: block;">Ambient Light: <input type="range" id="ambient-intensity" min="0.1" max="0.8" value="0.4" step="0.05" style="width: 140px;"></label>
            </div>
            
            <div style="margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px;">
                <h4 style="margin-top: 0;">🎨 Light Colors</h4>
                <label style="display: block;">R: <input type="range" id="light-r" min="0" max="1" value="1" step="0.05" style="width: 140px;"></label>
                <label style="display: block;">G: <input type="range" id="light-g" min="0" max="1" value="1" step="0.05" style="width: 140px;"></label>
                <label style="display: block;">B: <input type="range" id="light-b" min="0" max="1" value="1" step="0.05" style="width: 140px;"></label>
            </div>
        `;
        
        document.body.appendChild(controlsDiv);
        this.setupEventListeners();
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Main toggles
        document.getElementById('toggle-lighting').addEventListener('click', () => {
            this.lightingEnabled = !this.lightingEnabled;
        });
        
        document.getElementById('toggle-normals').addEventListener('click', () => {
            this.normalVisualization = !this.normalVisualization;
        });
        
        // Point light controls
        document.getElementById('point-light-toggle').addEventListener('change', (e) => {
            this.pointLightEnabled = e.target.checked;
        });
        
        document.getElementById('point-light-movement').addEventListener('change', (e) => {
            this.pointLightMoving = e.target.checked;
            console.log(`Point light movement: ${this.pointLightMoving ? 'enabled' : 'disabled'}`);
        });
        
        document.getElementById('point-light-speed').addEventListener('input', (e) => {
            this.pointLightSpeed = parseFloat(e.target.value);
            console.log(`Point light speed: ${this.pointLightSpeed}`);
        });
        
        document.getElementById('light-x').addEventListener('input', (e) => {
            if (!this.pointLightMoving) {
                this.pointLightPos[0] = parseFloat(e.target.value);
            }
        });
        document.getElementById('light-y').addEventListener('input', (e) => {
            this.pointLightPos[1] = parseFloat(e.target.value);
        });
        document.getElementById('light-z').addEventListener('input', (e) => {
            if (!this.pointLightMoving) {
                this.pointLightPos[2] = parseFloat(e.target.value);
            }
        });
        
        // Sun controls
        document.getElementById('spot-light-toggle').addEventListener('change', (e) => {
            this.spotLightEnabled = e.target.checked;
        });
        
        document.getElementById('sun-rotation-toggle').addEventListener('change', (e) => {
            this.sunRotationEnabled = e.target.checked;
            console.log(`Sun rotation: ${this.sunRotationEnabled ? 'enabled' : 'disabled'}`);
        });
        
        document.getElementById('sun-intensity').addEventListener('input', (e) => {
            this.sunIntensity = parseFloat(e.target.value);
            console.log(`Sun intensity: ${this.sunIntensity}`);
        });
        
        document.getElementById('ambient-intensity').addEventListener('input', (e) => {
            const intensity = parseFloat(e.target.value);
            this.ambientColor = [intensity, intensity, intensity * 1.1]; // Slightly blue ambient
            console.log(`Ambient intensity: ${intensity}`);
        });
        
        // Color controls
        document.getElementById('light-r').addEventListener('input', (e) => {
            this.lightColor[0] = parseFloat(e.target.value);
        });
        document.getElementById('light-g').addEventListener('input', (e) => {
            this.lightColor[1] = parseFloat(e.target.value);
        });
        document.getElementById('light-b').addEventListener('input', (e) => {
            this.lightColor[2] = parseFloat(e.target.value);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'l' || e.key === 'L') {
                this.lightingEnabled = !this.lightingEnabled;
            }
            if (e.key === 'n' || e.key === 'N') {
                this.normalVisualization = !this.normalVisualization;
            }
        });
    }
    
    // Render light markers
    renderLightMarkers(gl, program, camera) {
        // Point light marker (white)
        if (this.lightMarker && this.pointLightEnabled) {
            const u_baseColor = gl.getUniformLocation(program, 'u_baseColor');
            gl.uniform4f(u_baseColor, ...this.lightColor, 1.0);
            
            const u_texColorWeight = gl.getUniformLocation(program, 'u_texColorWeight');
            gl.uniform1f(u_texColorWeight, 0.0);
            
            this.lightMarker.render(gl, program, camera.viewMatrix, camera.projectionMatrix, 0.0);
        }
        
        // Sun marker (brilliant golden sun)
        if (this.spotLightMarker && this.spotLightEnabled) {
            const u_baseColor = gl.getUniformLocation(program, 'u_baseColor');
            gl.uniform4f(u_baseColor, 1.0, 0.95, 0.3, 1.0); // Bright golden sun
            
            const u_texColorWeight = gl.getUniformLocation(program, 'u_texColorWeight');
            gl.uniform1f(u_texColorWeight, 0.0);
            
            this.spotLightMarker.render(gl, program, camera.viewMatrix, camera.projectionMatrix, 0.0);
        }
    }
}