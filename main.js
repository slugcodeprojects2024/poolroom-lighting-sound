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

// Add these variables at the top with your other global variables
let frameCount = 0;
let fpsTime = 0;
let fps = 0;

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
    const deltaTime = (currentTime - lastTime) / 1000.0; // Convert to seconds
    lastTime = currentTime;
    
    // FPS calculation
    frameCount++;
    fpsTime += deltaTime;
    if (fpsTime >= 1.0) { // Update FPS every second
        fps = Math.round(frameCount / fpsTime);
        frameCount = 0;
        fpsTime = 0;
    }
    
    // Process keyboard input
    processInput(deltaTime);
    
    // Update physics (gravity, stamina, etc.)
    camera.updatePhysics(deltaTime);
    
    // Near the start of render function
    const isUnderwater = camera.collisionHandler.isInWater(camera.position.elements);
    
    if (isUnderwater) {
        // Blue tint for underwater
        gl.clearColor(0.0, 0.2, 0.4, 1.0); // Darker blue
        
        // Enable fog for underwater effect
        const u_FogColor = gl.getUniformLocation(program, 'u_FogColor');
        const u_FogNear = gl.getUniformLocation(program, 'u_FogNear');
        const u_FogFar = gl.getUniformLocation(program, 'u_FogFar');
        
        gl.uniform3f(u_FogColor, 0.0, 0.2, 0.4);
        gl.uniform1f(u_FogNear, 0.1);
        gl.uniform1f(u_FogFar, 20.0);
        
        // Update projection for underwater view
        camera.projectionMatrix.setPerspective(
            camera.fov * 0.8, // Reduced FOV underwater
            gl.canvas.width / gl.canvas.height,
            0.1,
            20.0
        );
    } else {
        // Normal rendering
        gl.clearColor(0.9, 0.9, 0.9, 1.0);
        camera.projectionMatrix.setPerspective(
            camera.zoom,
            canvas.width / canvas.height,
            0.1,
            100.0 // normal far plane
        );
    }
    
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Render the poolroom
    poolRoom.render(gl, program, camera);
    
    // Display status information
    updateStatusDisplay();
    
    // Update FPS counter
    updateFpsCounter();
    
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
        statusText += `Collision: ${collisionEnabled ? 'ON' : 'OFF'} | FPS: ${fps}`;
        
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

// Add this function to update the FPS counter
function updateFpsCounter() {
    const fpsElement = document.getElementById('fps-counter');
    if (fpsElement) {
        fpsElement.textContent = `FPS: ${fps}`;
        
        // Colorize based on performance
        if (fps >= 45) {
            fpsElement.style.color = '#00ff00'; // Good - green
        } else if (fps >= 30) {
            fpsElement.style.color = '#ffff00'; // OK - yellow
        } else {
            fpsElement.style.color = '#ff0000'; // Bad - red
        }
    }
}

// Start the application when the page loads
window.onload = init;