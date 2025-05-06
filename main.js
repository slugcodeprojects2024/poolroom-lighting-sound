// main.js - Main application entry point
let gl;
let program;
let camera;
let poolRoom;
let lastTime = 0;
let keys = {};
let mouseX = 0, mouseY = 0;
let mouseDown = false;

// Initialize WebGL context
function init() {
    // Get the canvas element
    const canvas = document.getElementById('webgl');
    
    // Get the WebGL context
    gl = canvas.getContext('webgl');
    if (!gl) {
        console.error('WebGL not supported by your browser!');
        return;
    }
    
    // Adjust canvas to full window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // Enable depth testing for 3D rendering
    gl.enable(gl.DEPTH_TEST);
    
    // Initialize shaders
    initShaders();
    
    // Create camera
    camera = new Camera(gl);
    
    // Create the poolroom
    poolRoom = new PoolRoom(gl);
    
    // Set up event listeners
    setupEventListeners(canvas);
    
    // Start the render loop
    lastTime = performance.now();
    render();
}

// Initialize shaders
function initShaders() {
    // Get shader source from HTML script tags
    const vertexShaderSource = document.getElementById('vertex-shader').text;
    const fragmentShaderSource = document.getElementById('fragment-shader').text;
    
    // Create shader program
    program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    
    // Use the program
    gl.useProgram(program);
}

// Handle keyboard and mouse events
function setupEventListeners(canvas) {
    // Keyboard events
    document.addEventListener('keydown', function(event) {
        keys[event.key] = true;
    });
    
    document.addEventListener('keyup', function(event) {
        keys[event.key] = false;
    });
    
    // Mouse movement events
    document.addEventListener('mousemove', function(event) {
        if (mouseDown) {
            const xOffset = event.clientX - mouseX;
            const yOffset = event.clientY - mouseY;
            mouseX = event.clientX;
            mouseY = event.clientY;
            
            camera.processMouseMovement(xOffset, yOffset);
        }
    });
    
    // Mouse button events
    canvas.addEventListener('mousedown', function(event) {
        mouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
        
        // Request pointer lock for mouse control
        canvas.requestPointerLock = canvas.requestPointerLock ||
                                    canvas.mozRequestPointerLock;
        canvas.requestPointerLock();
    });
    
    document.addEventListener('mouseup', function() {
        mouseDown = false;
        
        // Exit pointer lock
        document.exitPointerLock = document.exitPointerLock ||
                                   document.mozExitPointerLock;
        document.exitPointerLock();
    });
    
    // Pointer lock change event
    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
    
    function lockChangeAlert() {
        if (document.pointerLockElement === canvas ||
            document.mozPointerLockElement === canvas) {
            // Pointer locked - enable mouse movement tracking
            document.addEventListener('mousemove', updatePosition, false);
        } else {
            // Pointer unlocked - disable mouse movement tracking
            document.removeEventListener('mousemove', updatePosition, false);
        }
    }
    
    function updatePosition(e) {
        // Handle mouse movement with pointer lock
        const xOffset = e.movementX || e.mozMovementX || 0;
        const yOffset = e.movementY || e.mozMovementY || 0;
        
        camera.processMouseMovement(xOffset, yOffset);
    }
    
    // Mouse click for block manipulation
    canvas.addEventListener('click', function(event) {
        // Add block with left click
        if (event.button === 0) {
            const pos = camera.getFrontGridPosition();
            poolRoom.addBlock(pos.x, pos.y, pos.z);
        }
    });
    
    canvas.addEventListener('contextmenu', function(event) {
        // Remove block with right click
        event.preventDefault();
        const pos = camera.getFrontGridPosition();
        poolRoom.removeBlock(pos.x, pos.y, pos.z);
    });
    
    // Window resize event
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        // Update projection matrix for new aspect ratio
        const aspect = canvas.width / canvas.height;
        camera.projectionMatrix.setPerspective(camera.fov, aspect, 0.05, 1000.0);
    });
}

// Process keyboard input
function processInput(deltaTime) {
    // WASD keys for movement
    if (keys['w'] || keys['W']) {
        camera.processKeyboard('FORWARD', deltaTime);
    }
    if (keys['s'] || keys['S']) {
        camera.processKeyboard('BACKWARD', deltaTime);
    }
    if (keys['a'] || keys['A']) {
        camera.processKeyboard('LEFT', deltaTime);
    }
    if (keys['d'] || keys['D']) {
        camera.processKeyboard('RIGHT', deltaTime);
    }
    
    // QE keys for camera rotation
    if (keys['q'] || keys['Q']) {
        camera.processKeyboardRotation('LEFT');
    }
    if (keys['e'] || keys['E']) {
        camera.processKeyboardRotation('RIGHT');
    }
}

// Main render loop
function render() {
    // Calculate delta time
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000.0; // Convert to seconds
    lastTime = currentTime;
    
    // Process keyboard input
    processInput(deltaTime);
    
    // Clear the canvas
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Render the poolroom
    poolRoom.render(gl, program, camera);
    
    // Request next frame
    requestAnimationFrame(render);
}

// Start the application when the page loads
window.onload = init;