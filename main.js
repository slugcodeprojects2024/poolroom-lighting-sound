// main.js - Main application entry point

// Global variables
let gl;
let canvas;
let camera;
let world;
let program;
let textures = {};
let keys = {};

// Initialize WebGL
function main() {
    // Get canvas element
    canvas = document.getElementById('webgl');
    
    // Get WebGL context
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.error('Failed to get WebGL context');
        return;
    }
    
    // Initialize shaders
    const vertexShaderSource = document.getElementById('vertex-shader').textContent;
    const fragmentShaderSource = document.getElementById('fragment-shader').textContent;
    program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) {
        console.error('Failed to initialize shaders');
        return;
    }
    
    gl.useProgram(program);
    gl.program = program;
    
    // Enable depth test
    gl.enable(gl.DEPTH_TEST);
    
    // Initialize camera
    camera = new Camera(canvas);
    
    // Create textures programmatically
    createTextures();
    
    // Initialize event listeners
    initEventListeners();
    
    // Start the render loop
    requestAnimationFrame(render);
}

// Create textures programmatically
function createTextures() {
    // Create wall texture (brown)
    textures.wall = createColorTexture(gl, 150, 100, 50);
    
    // Create ground texture (green)
    textures.ground = createColorTexture(gl, 50, 150, 50);
    
    // Create sky texture (blue)
    textures.sky = createColorTexture(gl, 100, 150, 255);
    
    // Initialize the world
    world = new World(gl);

    // Create collision handler
    // Ensure CollisionHandler class is defined (collision.js must be loaded)
    const collisionHandler = new CollisionHandler(world.poolRoom);
    camera.setCollisionHandler(collisionHandler);
    
    // Position camera in the main pool room
    const mainPoolX = world.poolRoom.rooms.find(r => r.id === 'main_pool')?.x || 0;
    const mainPoolZ = world.poolRoom.rooms.find(r => r.id === 'main_pool')?.z || 0;
    const mainPoolWidth = world.poolRoom.rooms.find(r => r.id === 'main_pool')?.width || 20;
    const mainPoolLength = world.poolRoom.rooms.find(r => r.id === 'main_pool')?.length || 30;

    // Position camera in the center of the main pool room, just above floor level
    camera.eye = new Vector3([
        mainPoolX + mainPoolWidth/2, 
        1.5, 
        mainPoolZ + mainPoolLength/2
    ]);
    camera.at = new Vector3([
        mainPoolX + mainPoolWidth/2, 
        1.5, 
        mainPoolZ + mainPoolLength/2 - 5
    ]); // Looking toward the front of the pool
    camera.updateViewMatrix();
}

// Create a solid color texture
function createColorTexture(gl, r, g, b) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Create a 2x2 pixel texture with the specified color
    const pixels = new Uint8Array([
        r, g, b, 255,   r, g, b, 255,
        r, g, b, 255,   r, g, b, 255
    ]);
    
    // Upload the texture data
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    return texture;
}

// Initialize event listeners
function initEventListeners() {
    // Keyboard event listeners
    document.addEventListener('keydown', function(event) {
        keys[event.key.toLowerCase()] = true;
    });
    
    document.addEventListener('keyup', function(event) {
        keys[event.key.toLowerCase()] = false;
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (camera) {
            camera.updateProjectionMatrix(canvas);
        }
    });
    
    // Assuming 'canvas' is your HTML canvas element
    // Assuming 'camera' is your Camera instance
    
    canvas.addEventListener('mousedown', (ev) => camera.handleMouseDown(ev));
    canvas.addEventListener('mousemove', (ev) => camera.handleMouseMove(ev));
    canvas.addEventListener('mouseup', (ev) => camera.handleMouseUp(ev));
    canvas.addEventListener('mouseleave', (ev) => camera.handleMouseUp(ev)); // Optional: stops dragging if mouse leaves canvas
}

// Handle keyboard input
function handleKeyboardInput() {
    // Existing movement controls
    if (keys['w']) camera.moveForward();
    if (keys['s']) camera.moveBackwards();
    if (keys['a']) camera.moveLeft();
    if (keys['d']) camera.moveRight();
    if (keys['q']) camera.panLeft();
    if (keys['e']) camera.panRight();
    
    // Add vertical movement for free camera
    if (keys['r']) camera.moveUp();
    if (keys['f']) camera.moveDown();
    
    // Toggle collision detection with C key (one-time press)
    if (keys['c']) {
        // Assuming collisionHandler is accessible in this scope
        // You might need to ensure collisionHandler is defined globally or passed appropriately
        if (typeof collisionHandler !== 'undefined' && collisionHandler) {
            collisionHandler.toggleCollision();
        }
        keys['c'] = false; // Prevent repeated activation
    }
}

// Render function
function render() {
    // Handle keyboard input
    handleKeyboardInput();
    
    // Clear the canvas
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Only render if world is initialized
    if (world) {
        // Render the world
        world.render(gl, program, camera.viewMatrix, camera.projectionMatrix);
    }
    
    // Request the next frame
    requestAnimationFrame(render);
}

// Start the application when the page has loaded
window.onload = main;