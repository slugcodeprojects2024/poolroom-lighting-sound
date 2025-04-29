// Update Engine constructor
constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.gl = null;
    this.shader = null;
    this.cube = null;
    this.camera = null;
    this.input = null;
    this.lastFrameTime = 0;
    this.running = false;
    this.world = null; // Add this
    this.lastTime = 0; // Add this
    
    // Debug
    this.debugInfo = document.getElementById('debug-info');
}

// Update init method
init() {
    // Initialize WebGL
    this.initWebGL();
    
    // Create shader
    this.shader = new Shader(this.gl);
    if (!this.shader.compile(vertexShaderSource, fragmentShaderSource)) {
        console.error('Failed to compile shaders');
        return false;
    }
    
    // Create cube (keeping for reference)
    this.cube = new Cube(this.gl);
    
    // Create camera
    this.camera = new Camera();
    this.camera.position = [0, 0, 5];
    this.camera.updateViewMatrix();
    this.camera.updateProjectionMatrix(this.canvas.width / this.canvas.height);
    
    // Create input manager
    this.input = new InputManager();
    
    // Create world - add this
    try {
        console.log("Creating world...");
        this.world = new World(this.gl);
        this.world.generateTestWorld();
        
        // Position camera in the world
        this.camera.position = [16, 5, 16];
        this.camera.updateViewMatrix();
        
        console.log("World created successfully!");
    } catch (error) {
        console.error("Failed to create world:", error);
    }
    
    // Hide loading screen
    document.getElementById('loading-screen').classList.add('hidden');
    
    // Start game loop
    this.running = true;
    this.lastFrameTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
    
    return true;
}

// Update render method
render() {
    const gl = this.gl;
    
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Use shader program
    this.shader.use();
    
    // Set view and projection matrices
    this.shader.setMatrix4('u_viewMatrix', this.camera.viewMatrix);
    this.shader.setMatrix4('u_projectionMatrix', this.camera.projectionMatrix);
    
    // Pass time uniform for animations
    const timeLocation = this.shader.getUniformLocation('u_time');
    if (timeLocation) {
        gl.uniform1f(timeLocation, this.lastTime);
    }
    
    // Draw world if available
    if (this.world) {
        console.log("Drawing world...");
        this.world.draw(this.shader);
    } else {
        // Fall back to cube if world isn't available
        console.log("World not available, drawing cube...");
        
        // Create model matrix (rotation and translation)
        const modelMatrix = createTransformationMatrix();
        const rotationY = createRotationYMatrix(performance.now() * 0.001);
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