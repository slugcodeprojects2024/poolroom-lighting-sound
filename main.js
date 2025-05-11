// main.js - Main application entry point with collision detection and sprint
let gl;
let program;
let camera;
let poolRoom;
let collisionHandler;
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
    
    // Create collision handler and link it to camera
    collisionHandler = new CollisionHandler(poolRoom);
    camera.setCollisionHandler(collisionHandler);
    
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
        
        // Handle jump with spacebar
        if (event.key === ' ') {
            camera.jump();
        }
        
        // Handle sprint with Shift key
        if (event.key === 'Shift') {
            camera.setSprint(true);
        }
        
        // Toggle collision with 'C' key
        if (event.key === 'c' || event.key === 'C') {
            collisionHandler.toggleCollision();
        }
    });
    
    document.addEventListener('keyup', function(event) {
        keys[event.key] = false;
        
        // Stop sprinting when Shift is released
        if (event.key === 'Shift') {
            camera.setSprint(false);
        }
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
            const success = poolRoom.addBlock(pos.x, pos.y, pos.z);
            
            // Update collision objects if block was added
            if (success) {
                collisionHandler.updateCollisionObjects();
            }
        }
    });
    
    canvas.addEventListener('contextmenu', function(event) {
        // Remove block with right click
        event.preventDefault();
        const pos = camera.getFrontGridPosition();
        const success = poolRoom.removeBlock(pos.x, pos.y, pos.z);
        
        // Update collision objects if block was removed
        if (success) {
            collisionHandler.updateCollisionObjects();
        }
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
    
    // Update physics (gravity, stamina, etc.)
    camera.updatePhysics(deltaTime);
    
    // Clear the canvas
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Render the poolroom
    poolRoom.render(gl, program, camera);
    
    // Display status information
    updateStatusDisplay();
    
    // Request next frame
    requestAnimationFrame(render);
}

// Update the status display
function updateStatusDisplay() {
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        const stamina = Math.round(camera.getStaminaPercentage());
        const collisionEnabled = collisionHandler ? collisionHandler.enabled : true;
        
        let statusText = `Controls: WASD - Move | Mouse - Look | Q/E - Rotate<br>`;
        statusText += `Space - Jump | Shift - Sprint | C - Toggle Collision<br>`;
        statusText += `Left/Right Click - Add/Remove Blocks<br>`;
        statusText += `Collision: ${collisionEnabled ? 'ON' : 'OFF'}`;
        
        if (camera.isSprinting) {
            statusText += ` | SPRINTING`;
        }
        
        statusDiv.innerHTML = statusText;
    }
    
    // Update stamina bar
    if (typeof updateStaminaBar === 'function') {
        updateStaminaBar(camera.getStaminaPercentage());
    }
}

// Start the application when the page loads
window.onload = init;