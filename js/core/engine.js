class Engine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.gl = null;
        this.shader = null;
        this.cube = null;
        this.camera = null;
        this.input = null;
        this.world = null;
        this.lastFrameTime = 0;
        this.running = false;
        
        // Debug
        this.debugInfo = document.getElementById('debug-info');
    }
    
    /**
     * Initialize the game engine
     */
    init() {
        // Initialize WebGL
        this.initWebGL();
        
        // Create shader
        this.shader = new Shader(this.gl);
        if (!this.shader.compile(vertexShaderSource, fragmentShaderSource)) {
            console.error('Failed to compile shaders');
            return false;
        }
        
        // Create cube
        this.cube = new Cube(this.gl);
        
        // Create camera
        this.camera = new Camera();
        this.camera.position = [0, 0, 5];
        this.camera.updateViewMatrix();
        this.camera.updateProjectionMatrix(this.canvas.width / this.canvas.height);
        
        // Create input manager
        this.input = new InputManager();
        this.input.init(this.canvas);
        
        // Create world
        try {
            console.log("Creating world...");
            this.world = new World(this.gl);
            this.world.generateTestWorld();
            
            // Position camera above water
            this.camera.position = [16, 3, 16]; // Center of the world, above water
            this.camera.updateViewMatrix();
            
            console.log("World created successfully");
        } catch (error) {
            console.error("Error creating world:", error);
            this.world = null;
        }
        
        // Hide loading screen
        document.getElementById('loading-screen').classList.add('hidden');
        
        // Start game loop
        this.running = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
        
        return true;
    }
    
    /**
     * Initialize WebGL context
     */
    initWebGL() {
        try {
            this.gl = this.canvas.getContext('webgl');
            
            if (!this.gl) {
                console.error('WebGL not supported, falling back to experimental-webgl');
                this.gl = this.canvas.getContext('experimental-webgl');
            }
            
            if (!this.gl) {
                throw new Error('WebGL not supported');
            }
            
            // Set viewport
            this.resize();
            
            // Enable depth testing
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.depthFunc(this.gl.LEQUAL);
            
            // Set clear color (sky blue)
            this.gl.clearColor(0.5, 0.8, 1.0, 1.0);
            
        } catch (error) {
            console.error('Error initializing WebGL:', error);
            return false;
        }
        
        return true;
    }
    
    /**
     * Resize the canvas to fill the window
     */
    resize() {
        // Get the display size of the canvas
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;
        
        // Check if the canvas is not the same size
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            // Make the canvas the same size
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            
            // Update GL viewport
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            
            // Update camera aspect ratio
            if (this.camera) {
                this.camera.updateProjectionMatrix(this.canvas.width / this.canvas.height);
            }
        }
    }
    
    /**
     * Main game loop
     * @param {number} timestamp - Current timestamp
     */
    gameLoop(timestamp) {
        // Calculate delta time in seconds
        const deltaTime = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;
        
        // Update
        this.update(deltaTime);
        
        // Render
        this.render();
        
        // Debug info
        this.updateDebugInfo(deltaTime);
        
        // Continue the loop
        if (this.running) {
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    /**
     * Update game state
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Check for resize
        this.resize();
        
        // Handle mouse look
        const mouseSensitivity = 0.003;  // Adjust as needed
        const mouseMovement = this.input.getMouseMovement();
        
        if (mouseMovement.x !== 0 || mouseMovement.y !== 0) {
            this.camera.lookLeftRight(mouseMovement.x * mouseSensitivity);
            this.camera.lookUpDown(mouseMovement.y * mouseSensitivity);
        }
        
        // Handle camera movement
        const moveSpeed = 2.5 * deltaTime;
        const rotateSpeed = 1.5 * deltaTime;
        
        // Forward/backward movement with collision detection if world exists
        if (this.input.isKeyPressed('KeyW')) {
            if (this.world) {
                this.camera.moveForwardWithCollision(moveSpeed, this.world);
            } else {
                this.camera.moveForward(moveSpeed);
            }
        }
        if (this.input.isKeyPressed('KeyS')) {
            if (this.world) {
                this.camera.moveBackwardWithCollision(moveSpeed, this.world);
            } else {
                this.camera.moveBackward(moveSpeed);
            }
        }
        
        // Left/right movement with collision detection if world exists
        if (this.input.isKeyPressed('KeyA')) {
            if (this.world) {
                this.camera.moveLeftWithCollision(moveSpeed, this.world);
            } else {
                this.camera.moveLeft(moveSpeed);
            }
        }
        if (this.input.isKeyPressed('KeyD')) {
            if (this.world) {
                this.camera.moveRightWithCollision(moveSpeed, this.world);
            } else {
                this.camera.moveRight(moveSpeed);
            }
        }
        
        // Rotation (keyboard as backup to mouse)
        if (this.input.isKeyPressed('KeyQ')) {
            this.camera.rotateLeft(rotateSpeed);
        }
        if (this.input.isKeyPressed('KeyE')) {
            this.camera.rotateRight(rotateSpeed);
        }
    }
    
    /**
     * Render the scene
     */
    render() {
        const gl = this.gl;
        
        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Use shader program
        this.shader.use();
        
        // Set view and projection matrices
        this.shader.setMatrix4('u_viewMatrix', this.camera.viewMatrix);
        this.shader.setMatrix4('u_projectionMatrix', this.camera.projectionMatrix);
        
        // Current time for animations
        const currentTime = performance.now() * 0.001; // Convert to seconds
        
        // Draw world if available, otherwise fall back to cube
        if (this.world) {
            // Draw the world with current time for animations
            this.world.draw(this.shader, currentTime);
        } else {
            // Fall back to cube if world isn't available
            
            // Create model matrix (rotation and translation)
            const modelMatrix = createTransformationMatrix();
            const rotationY = createRotationYMatrix(currentTime);
            const translation = createTranslationMatrix(0, 0, 0);
            const scale = createScaleMatrix(1, 1, 1);
            
            // Combine transformations: translation * rotation * scale
            const tempMatrix = multiplyMatrices(translation, rotationY);
            const finalModelMatrix = multiplyMatrices(tempMatrix, scale);
            
            // Set model matrix
            this.shader.setMatrix4('u_modelMatrix', finalModelMatrix);
            
            // Draw cube
            this.cube.draw(this.shader);
        }
    }
    
    /**
     * Update debug information
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updateDebugInfo(deltaTime) {
        const fps = Math.round(1 / deltaTime);
        const position = this.camera.position.map(val => val.toFixed(2)).join(', ');
        const front = this.camera.front.map(val => val.toFixed(2)).join(', ');
        
        this.debugInfo.innerHTML = `
            FPS: ${fps}<br>
            Position: ${position}<br>
            Direction: ${front}<br>
            Controls: WASD - Move, Mouse/QE - Look
        `;
    }
}