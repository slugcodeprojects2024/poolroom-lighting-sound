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
        
        // Sun-based spot light properties - adjusted for realistic lighting
        this.sunPosition = [16, 60, 16]; // Higher up to avoid bleeding through
        this.spotLightPos = this.sunPosition.slice();
        this.spotLightDir = [0, -1, 0]; // Points straight down from sun
        this.spotLightCutoff = Math.cos(Math.PI / 8); // Wider 22.5 degree cone for more coverage
        this.sunColor = [2.5, 2.0, 1.5]; // Much brighter sun for realistic daylight
        
        // Enhanced sun movement (more noticeable)
        this.sunMovementEnabled = true;
        this.sunMovementSpeed = 0.15; // Slower, more realistic
        this.sunMovementRadius = 20.0; // Larger movement radius
        
        // Ambient lighting control
        this.ambientStrength = 0.15; // Lower ambient when sun is active
        this.baseAmbientStrength = 0.4; // Higher base ambient when no sun
        
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
        
        // Sun marker (large golden sun in sky)
        this.spotLightMarker = new CubeClass(this.gl);
        this.spotLightMarker.setScale(3.0, 3.0, 3.0);
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
        
        // Enhanced sun movement - keep it high to avoid bleeding through ceiling
        if (this.sunMovementEnabled) {
            // Move sun in a wider arc across the sky, but keep it high
            const sunAngle = this.lightAnimationTime * this.sunMovementSpeed;
            this.sunPosition[0] = 16 + Math.cos(sunAngle) * this.sunMovementRadius;
            this.sunPosition[2] = 16 + Math.sin(sunAngle) * this.sunMovementRadius;
            
            // Keep sun high above ceiling (ceiling is at y=5, so keep sun above y=50)
            this.sunPosition[1] = 60 + Math.sin(sunAngle * 0.3) * 10; // Vary between 50-70
            
            this.spotLightPos = this.sunPosition.slice();
            
            // Update sun color based on position (warmer when lower)
            const heightFactor = (this.sunPosition[1] - 50) / 20; // Normalize height variation
            this.sunColor[0] = 2.5 + (1 - heightFactor) * 0.5; // More red when lower
            this.sunColor[1] = 2.0;
            this.sunColor[2] = 1.5 + heightFactor * 0.3; // More blue when higher
        }
        
        // Enhanced sun marker with more dramatic glow effect
        if (this.spotLightMarker) {
            this.spotLightMarker.modelMatrix.setIdentity();
            this.spotLightMarker.modelMatrix.setTranslate(
                this.sunPosition[0],
                this.sunPosition[1],
                this.sunPosition[2]
            );
            
            // More dramatic pulsing glow effect with corona
            const pulseBase = 6.0; // Even larger base size since it's higher up
            const pulseAmount = 2.0; // More dramatic pulsing
            const glowScale = pulseBase + pulseAmount * Math.sin(this.lightAnimationTime * 1.5);
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
        const currentAmbient = this.spotLightEnabled ? this.ambientStrength : this.baseAmbientStrength;
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
        
        gl.uniform3fv(u_SpotLightPos, this.spotLightPos);
        gl.uniform3fv(u_SpotLightDir, this.spotLightDir);
        gl.uniform1f(u_SpotLightCutoff, this.spotLightCutoff);
        gl.uniform3fv(u_SunColor, this.sunColor);
        
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
            
            <div style="margin: 15px 0; padding: 10px; background: rgba(255,215,0,0.2); border-radius: 5px;">
                <h4 style="margin-top: 0; color: #ffd700;">☀️ Sun Spotlight</h4>
                <label><input type="checkbox" id="spot-light-toggle" checked> Enable Sun Light</label><br>
                <label><input type="checkbox" id="sun-movement-toggle" checked> Sun Movement</label><br>
                <label style="display: block; margin-top: 8px;">Height: <input type="range" id="sun-height" min="25" max="80" value="45" step="2" style="width: 140px;"></label>
                <label style="display: block;">Beam: <input type="range" id="sun-beam" min="0.1" max="0.9" value="0.5" step="0.05" style="width: 140px;"></label>
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
        
        document.getElementById('sun-movement-toggle').addEventListener('change', (e) => {
            this.sunMovementEnabled = e.target.checked;
        });
        
        document.getElementById('sun-height').addEventListener('input', (e) => {
            this.sunPosition[1] = parseFloat(e.target.value);
            this.spotLightPos[1] = this.sunPosition[1];
        });
        
        document.getElementById('sun-beam').addEventListener('input', (e) => {
            this.spotLightCutoff = parseFloat(e.target.value);
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
        
        // Enhanced sun marker (bright golden with corona effect)
        if (this.spotLightMarker && this.spotLightEnabled) {
            const u_baseColor = gl.getUniformLocation(program, 'u_baseColor');
            
            // Render sun with bright golden color and emission-like effect
            gl.uniform4f(u_baseColor, 1.5, 1.2, 0.6, 0.9); // Bright golden with slight transparency
            
            const u_texColorWeight = gl.getUniformLocation(program, 'u_texColorWeight');
            gl.uniform1f(u_texColorWeight, 0.0);
            
            // Disable depth testing temporarily for glow effect
            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blending for glow
            
            this.spotLightMarker.render(gl, program, camera.viewMatrix, camera.projectionMatrix, 0.0);
            
            // Restore normal rendering state
            gl.enable(gl.DEPTH_TEST);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }
    }
}