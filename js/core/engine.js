// const mat4 = glMatrix.mat4; // Add this line at the top if mat4 is used directly in this file

class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = this.canvas.getContext('webgl');
        if (!this.gl) {
            console.error("WebGL not supported!");
            return;
        }

        this.shader = null;
        this.camera = null;
        this.input = null;
        this.cubeGeometry = null; // Shared cube geometry
        this.world = null; // Added: World instance

        // Remove old texture property if it exists
        // this.sampleTexture = null;
    }

    // Remove the old loadTexture and isPowerOf2 methods from Engine
    // loadTexture(url) { ... }
    // isPowerOf2(value) { ... }

    /**
     * Initialize WebGL context, shaders, geometry, camera, input, and world.
     */
    init() {
        const gl = this.gl;

        // Basic WebGL setup
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Black background
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // --- Shader Setup ---
        this.shader = new Shader(gl);
        // Assuming vertexShaderSource and fragmentShaderSource are globally defined
        if (!this.shader.compile(vertexShaderSource, fragmentShaderSource)) {
            return; // Stop if shader compilation fails
        }

        // --- Geometry Setup ---
        this.cubeGeometry = new Cube(gl); // Create the shared cube geometry

        // --- World Setup ---
        this.world = new World(gl, this.cubeGeometry, this.shader); // Create World instance
        this.world.loadTextures(); // Load textures needed by the world

        // Define a simple map layout (0=empty, 1=wall, 2=floor)
        const mapData = [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 2, 2, 2, 2, 2, 1],
            [1, 2, 0, 1, 0, 2, 1], // Add some empty space and inner walls
            [1, 2, 2, 2, 2, 2, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ];
        this.world.generateWorld(mapData); // Generate blocks based on the map

        // --- Camera Setup ---
        const aspectRatio = this.canvas.width / this.canvas.height;
        this.camera = new Camera(aspectRatio);
        // Set initial camera position (e.g., inside the map)
        this.camera.setPosition([3.5, 0.5, 2.5]); // Adjust as needed

        // --- Input Setup ---
        this.input = new Input();
        this.input.init();

        console.log("Engine initialized.");
    }

    /**
     * Update game state (e.g., handle input, update camera)
     * @param {number} deltaTime - Time elapsed since the last frame
     */
    update(deltaTime) {
        if (!this.camera || !this.input) return;

        // Handle camera movement based on input
        const moveSpeed = 5.0 * deltaTime; // Adjust speed as needed
        const rotateSpeed = Math.PI * 0.5 * deltaTime; // Radians per second

        // Forward/Backward
        if (this.input.isKeyPressed('w')) {
            this.camera.moveForward(moveSpeed);
        }
        if (this.input.isKeyPressed('s')) {
            this.camera.moveForward(-moveSpeed);
        }
        // Strafe Left/Right
        if (this.input.isKeyPressed('a')) {
            this.camera.moveRight(-moveSpeed);
        }
        if (this.input.isKeyPressed('d')) {
            this.camera.moveRight(moveSpeed);
        }
        // Rotation
        if (this.input.isKeyPressed('q')) {
            this.camera.rotateY(-rotateSpeed);
        }
        if (this.input.isKeyPressed('e')) {
            this.camera.rotateY(rotateSpeed);
        }

        // Update camera matrices after movement/rotation
        this.camera.updateViewMatrix();
    }

    /**
     * Render loop
     */
    render() {
        const gl = this.gl;
        if (!gl || !this.shader || !this.camera || !this.world) {
            console.error("Engine not fully initialized for rendering.");
            return;
        }

        // Clear buffers
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Use the shader program
        this.shader.use();

        // Set camera matrices (View and Projection)
        this.shader.setMatrix4('u_viewMatrix', this.camera.getViewMatrix());
        this.shader.setMatrix4('u_projectionMatrix', this.camera.getProjectionMatrix());

        // --- Render the World ---
        // The world's render method will handle setting model matrices
        // and binding textures for each block.
        this.world.render();

        // --- Remove old single cube drawing logic ---
        /*
        // --- Texture Binding ---
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.sampleTexture); // Use the old sample texture
        this.shader.setInt('u_texture', 0);
        this.shader.setBool('u_useTexture', true);

        // --- Draw the Cube ---
        const modelMatrix = mat4.create();
        this.shader.setMatrix4('u_modelMatrix', modelMatrix);
        this.cubeGeometry.draw(this.shader); // Use the shared geometry
        */

        // Request next frame
        // requestAnimationFrame(this.render.bind(this)); // This should be called from the start/game loop
    }

    /**
     * Start the game loop
     */
    start() {
        if (!this.gl) return;

        let lastTime = 0;
        const gameLoop = (currentTime) => {
            currentTime *= 0.001; // Convert time to seconds
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            this.update(deltaTime); // Update game state
            this.render();         // Render the scene

            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
        console.log("Game loop started.");
    }
}