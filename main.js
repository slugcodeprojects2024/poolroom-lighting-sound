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
let canvas;

// Add these variables at the top with your other global variables
let frameCount = 0;
let fpsTime = 0;
let fps = 0;

// Initialize WebGL context
function init() {
    // Get the canvas element
    canvas = document.getElementById('webgl');
    
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
    
    // Add separate mousedown and click handlers
    canvas.addEventListener('mousedown', function(event) {
        // This just captures the initial mouse press
        mouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
        
        // Request pointer lock if not already locked
        if (document.pointerLockElement !== canvas && 
            document.mozPointerLockElement !== canvas) {
            canvas.requestPointerLock = canvas.requestPointerLock ||
                                       canvas.mozRequestPointerLock;
            canvas.requestPointerLock();
        }
    });

    // Add dedicated click handler specifically for block placement
    document.addEventListener('click', function(event) {
        // Only process block placement when pointer is locked
        if (document.pointerLockElement === canvas || 
            document.mozPointerLockElement === canvas) {
            
            // Left-click to add block
            if (event.button === 0) {
                console.log("Left click detected - placing block");
                const pos = camera.getTargetBlock(5.0, 0.1);
                console.log("Target position:", pos);
                const blockType = blockIndicator.getCurrentBlockType();
                const success = poolRoom.addBlock(pos.x, pos.y, pos.z, blockType);
                
                // Update collision objects if block was added
                if (success) {
                    console.log("Block placed successfully");
                    collisionHandler.updateCollisionObjects();
                    showNotification(`Block placed: ${blockIndicator.blockTypeNames[blockType]}`, 1000);
                } else {
                    console.log("Failed to place block");
                }
            }
        }
    });

    // Right-click handler for block removal
    canvas.addEventListener('contextmenu', function(event) {
        // Prevent browser context menu
        event.preventDefault();
        
        // Only process when pointer is locked
        if (document.pointerLockElement === canvas || 
            document.mozPointerLockElement === canvas) {
            
            console.log("Right click detected - removing block");
            // Remove the last placed block
            const success = poolRoom.removeLastBlock();
            
            // Update collision objects if block was removed
            if (success) {
                collisionHandler.updateCollisionObjects();
                showNotification('Last block removed', 1000);
            } else {
                showNotification('No blocks to remove', 1000);
            }
        }
    });

    document.addEventListener('mouseup', function() {
        mouseDown = false;
        
        // Don't exit pointer lock when releasing mouse button
        // This allows for continuous camera control
    });

    // Pointer lock change event
    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

    // Add pointer lock error handling
    document.addEventListener('pointerlockerror', function() {
        console.error("Error obtaining pointer lock");
    }, false);
    document.addEventListener('mozpointerlockerror', function() {
        console.error("Error obtaining pointer lock (moz)");
    }, false);
    
    function lockChangeAlert() {
        if (document.pointerLockElement === canvas ||
            document.mozPointerLockElement === canvas) {
            console.log("Pointer locked successfully");
            // Pointer locked - enable mouse movement tracking
            document.addEventListener('mousemove', updatePosition, false);
        } else {
            console.log("Pointer unlocked");
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
    const deltaTime = (currentTime - lastTime) / 1000.0;
    lastTime = currentTime;
    
    // FPS calculation
    frameCount++;
    fpsTime += deltaTime;
    if (fpsTime >= 1.0) {
        fps = Math.round(frameCount / fpsTime);
        frameCount = 0;
        fpsTime = 0;
    }
    
    // Process keyboard input
    processInput(deltaTime);
    
    // Update physics
    camera.updatePhysics(deltaTime);
    
    // Check if underwater
    const isUnderwater = camera.collisionHandler.isInWater(camera.position.elements);
    
    if (isUnderwater) {
        gl.clearColor(0.0, 0.2, 0.4, 1.0);
    } else {
        gl.clearColor(0.9, 0.9, 0.9, 1.0);
    }
    
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Render the poolroom
    poolRoom.render(gl, program, camera);
    
    // Update status display
    const statusText = `FPS: ${fps} | Collision: ${collisionHandler.collisionEnabled ? 'ON' : 'OFF'}`;
    document.getElementById('status').innerHTML = statusText;
    
    requestAnimationFrame(render);
}

// Start the application when the page loads
window.onload = init;