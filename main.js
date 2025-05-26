import { Vector3 } from './Vector3.js';
import { Camera } from './camera.js';
import { InputManager } from './InputManager.js';
import { CollisionHandler } from './collision.js';
import { PoolRoom } from './poolRoom.js';

// Main application entry point with collision detection and sprint
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

// FPS tracking variables
let frameCount = 0;
let fpsTime = 0;
let fps = 0;

// Ladder climbing variables
let isOnLadder = false;
let ladderSpeed = 3.0;

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
    
    console.log('Game initialized with ladder climbing system');
    console.log('Controls: WASD to move, F near ladder to climb, W/S to climb up/down');
    
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

// Create shader program
function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program:', gl.getProgramInfoLog(program));
        return null;
    }
    
    return program;
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    
    return shader;
}

// Check for ladder proximity and update UI
function checkLadderProximity() {
    const cameraPos = camera.position.elements;
    const playerPos = [cameraPos[0], cameraPos[1] - 1.6, cameraPos[2]]; // Adjust for eye height
    const playerDims = [0.8, 1.8, 0.8];
    
    const nearLadder = poolRoom.getLadderAt(playerPos, playerDims);
    
    // Update UI hints
    if (nearLadder && !isOnLadder) {
        if (window.showLadderHint) window.showLadderHint();
    } else {
        if (window.hideLadderHint) window.hideLadderHint();
    }
    
    if (isOnLadder) {
        if (window.showClimbingIndicator) window.showClimbingIndicator();
    } else {
        if (window.hideClimbingIndicator) window.hideClimbingIndicator();
    }
    
    return nearLadder;
}

// Handle keyboard and mouse events
function setupEventListeners(canvas) {
    // Keyboard events
    document.addEventListener('keydown', function(event) {
        keys[event.key] = true;
        
        // Handle jump with spacebar (only when not climbing)
        if (event.key === ' ' && !isOnLadder) {
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
        
        // Ladder climbing toggle with F key
        if (event.key === 'f' || event.key === 'F') {
            const cameraPos = camera.position.elements;
            const playerPos = [cameraPos[0], cameraPos[1] - 1.6, cameraPos[2]];
            const playerDims = [0.8, 1.8, 0.8];
            
            const nearLadder = poolRoom.getLadderAt(playerPos, playerDims);
            
            if (nearLadder) {
                isOnLadder = !isOnLadder;
                
                if (isOnLadder) {
                    // Snap to ladder center when starting to climb
                    const ladderMatrix = nearLadder.modelMatrix.elements;
                    camera.position.elements[0] = ladderMatrix[12];
                    camera.position.elements[2] = ladderMatrix[14];
                    console.log('Started climbing ladder');
                } else {
                    console.log('Stopped climbing ladder');
                }
            }
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

    // Add dedicated click handler for ladder interaction
    document.addEventListener('click', function(event) {
        // Only process when pointer is locked
        if (document.pointerLockElement === canvas || 
            document.mozPointerLockElement === canvas) {
            
            const cameraPos = camera.position.elements;
            const playerPos = [cameraPos[0], cameraPos[1] - 1.6, cameraPos[2]];
            const playerDims = [0.8, 1.8, 0.8];
            
            const nearLadder = poolRoom.getLadderAt(playerPos, playerDims);
            
            if (nearLadder) {
                isOnLadder = !isOnLadder;
                
                if (isOnLadder) {
                    const ladderMatrix = nearLadder.modelMatrix.elements;
                    camera.position.elements[0] = ladderMatrix[12];
                    camera.position.elements[2] = ladderMatrix[14];
                    console.log('Started climbing ladder (click)');
                } else {
                    console.log('Stopped climbing ladder (click)');
                }
            }
        }
    });

    document.addEventListener('mouseup', function() {
        mouseDown = false;
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
    const nearLadder = checkLadderProximity();
    
    if (isOnLadder && nearLadder) {
        // LADDER CLIMBING MODE
        
        // IMPORTANT: Disable collision detection while climbing
        const originalCollisionState = collisionHandler.enabled;
        collisionHandler.enabled = false;
        
        // Override gravity/physics while on ladder
        if (camera.velocity && camera.velocity.elements) {
            camera.velocity.elements[1] = 0; // Stop falling
        }
        
        // Vertical movement only
        if (keys['w'] || keys['W']) {
            camera.position.elements[1] += ladderSpeed * deltaTime;
        }
        if (keys['s'] || keys['S']) {
            camera.position.elements[1] -= ladderSpeed * deltaTime;
        }
        
        // Keep player centered on ladder
        const ladderMatrix = nearLadder.modelMatrix.elements;
        camera.position.elements[0] = ladderMatrix[12];
        camera.position.elements[2] = ladderMatrix[14];
        
        // Height limits - allow climbing to the actual roof level
        const minHeight = 0.6;  // Ground level + eye height
        const maxHeight = poolRoom.maxHeight + 1.5;  // Allow climbing onto the roof
        
        if (camera.position.elements[1] < minHeight) {
            camera.position.elements[1] = minHeight;
        }
        if (camera.position.elements[1] > maxHeight) {
            camera.position.elements[1] = maxHeight;
            console.log('Reached maximum climbing height - you can step off the ladder now');
        }
        
        // Update camera vectors
        if (camera.updateCameraVectors) {
            camera.updateCameraVectors();
        }
        
        // Re-enable collision for next frame
        collisionHandler.enabled = originalCollisionState;
        
    } else {
        // NORMAL MOVEMENT MODE
        if (isOnLadder) {
            isOnLadder = false; // Lost ladder contact
            console.log('Left ladder - normal movement resumed');
        }
        
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
    const statusText = `
        FPS: ${fps} | Collision: ${collisionHandler.enabled ? 'ON' : 'OFF'}<br>
        Position: ${camera.position.elements.map(v => v.toFixed(1)).join(', ')}<br>
        Climbing: ${isOnLadder ? 'YES' : 'NO'}<br>
        Controls: WASD - Move | Mouse - Look | Space - Jump<br>
        Click or F near ladder to climb | W/S to climb up/down while climbing
    `;
    document.getElementById('status').innerHTML = statusText;
    
    // Update FPS counter
    const fpsCounter = document.getElementById('fps-counter');
    if (fpsCounter) {
        fpsCounter.textContent = `FPS: ${fps}`;
    }
    
    requestAnimationFrame(render);
}

// Start the application when the page loads
window.onload = init;