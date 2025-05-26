// Updated main.js - Complete integration
import { Vector3 } from './Vector3.js';
import { Camera } from './camera.js';
import { CollisionHandler } from './collision.js';
import { PoolRoomWithLighting } from './poolRoom.js';
import { LightingSystem } from './lighting.js';
import { CubeWithNormals, Sphere } from './geometryWithNormals.js';
import { Model } from './objLoader.js';
import { CollectibleSystem } from './collectibles.js';

// Main application with complete lighting and collectibles
let gl;
let program;
let camera;
let poolRoom;
let collisionHandler;
let lightingSystem;
let collectibleSystem;
let lastTime = 0;
let keys = {};
let mouseX = 0, mouseY = 0;
let mouseDown = false;
let canvas;

// FPS tracking
let frameCount = 0;
let fpsTime = 0;
let fps = 0;

// Ladder climbing
let isOnLadder = false;
let ladderSpeed = 3.0;

// Assignment 4 objects
let testCube;
let testSphere;

// Add a global variable for toggling test objects visibility
let showTestObjects = true;

// Initialize WebGL context
function init() {
    canvas = document.getElementById('webgl');
    
    gl = canvas.getContext('webgl');
    if (!gl) {
        console.error('WebGL not supported by your browser!');
        return;
    }
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    gl.enable(gl.DEPTH_TEST);
    
    // Initialize shaders with lighting support
    initShadersWithLighting();
    
    // Create camera
    camera = new Camera(gl);
    
    // Create the poolroom with lighting support
    poolRoom = new PoolRoomWithLighting(gl);
    
    // Create collision handler
    collisionHandler = new CollisionHandler(poolRoom);
    camera.setCollisionHandler(collisionHandler);
    
    // Initialize lighting system with sun
    lightingSystem = new LightingSystem(gl);
    lightingSystem.initLightMarkers(CubeWithNormals);
    
    // Initialize collectible system
    collectibleSystem = new CollectibleSystem(gl, poolRoom);
    
    // Create Assignment 4 required objects
    createAssignment4Objects();
    
    // Set up event listeners
    setupEventListeners(canvas);
    
    console.log('🎉 Assignment 4 Complete System Loaded!');
    console.log('☀️ Sun lighting + 📦 Collectibles + 🌟 Full Phong lighting');
    console.log('Controls: WASD - Move | L - Toggle Lighting | N - Toggle Normals');
    
    lastTime = performance.now();
    render();
}

// Initialize shaders with lighting
function initShadersWithLighting() {
    const vertexShaderSource = document.getElementById('vertex-shader').text;
    const fragmentShaderSource = document.getElementById('fragment-shader').text;
    
    program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
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

// Create Assignment 4 required objects
function createAssignment4Objects() {
    // Create sphere with same size as cube (radius 0.5 to match cube's 1x1x1 size)
    testSphere = new Sphere(gl, 0.5, 20); // radius 0.5, 20 segments for smoothness
    testSphere.modelMatrix.setIdentity();
    // Position sphere between pillar rows in the pool - left side
    testSphere.modelMatrix.translate(12, 0.5, 16); // Between left pillars
    
    // Create cube
    testCube = new CubeWithNormals(gl);
    testCube.modelMatrix.setIdentity();
    // Position cube between pillar rows in the pool - right side  
    testCube.modelMatrix.translate(20, 0.5, 16); // Between right pillars
    
    console.log('✅ Assignment 4 objects created: Cube + Sphere with normals');
}

// Check for ladder proximity
function checkLadderProximity() {
    const cameraPos = camera.position.elements;
    const playerPos = [cameraPos[0], cameraPos[1] - 1.6, cameraPos[2]];
    const playerDims = [0.8, 1.8, 0.8];
    
    const nearLadder = poolRoom.getLadderAt(playerPos, playerDims);
    
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

// Setup event listeners
function setupEventListeners(canvas) {
    // Keyboard events - Use event.code for more reliable key tracking
    document.addEventListener('keydown', function(event) {
        keys[event.code] = true;
        
        if (event.code === 'Space' && !isOnLadder) {
            camera.jump();
        }
        
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            camera.setSprint(true);
        }
        
        if (event.code === 'KeyC') {
            collisionHandler.toggleCollision();
        }
        
        // Ladder climbing
        if (event.code === 'KeyF') {
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
                    console.log('Started climbing ladder');
                } else {
                    console.log('Stopped climbing ladder');
                }
            }
        }
        
        // Toggle test objects visibility with 'T' key
        if (event.code === 'KeyT') {
            showTestObjects = !showTestObjects;
            console.log(`Test objects ${showTestObjects ? 'shown' : 'hidden'}`);
        }
    });
    
    document.addEventListener('keyup', function(event) {
        keys[event.code] = false;
        
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            camera.setSprint(false);
        }
    });
    
    // Mouse events
    document.addEventListener('mousemove', function(event) {
        if (mouseDown) {
            const xOffset = event.clientX - mouseX;
            const yOffset = event.clientY - mouseY;
            mouseX = event.clientX;
            mouseY = event.clientY;
            
            camera.processMouseMovement(xOffset, yOffset);
        }
    });
    
    canvas.addEventListener('mousedown', function(event) {
        mouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
        
        if (document.pointerLockElement !== canvas && 
            document.mozPointerLockElement !== canvas) {
            canvas.requestPointerLock = canvas.requestPointerLock ||
                                       canvas.mozRequestPointerLock;
            canvas.requestPointerLock();
        }
    });

    document.addEventListener('click', function(event) {
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

    // Pointer lock events
    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
    
    function lockChangeAlert() {
        if (document.pointerLockElement === canvas ||
            document.mozPointerLockElement === canvas) {
            document.addEventListener('mousemove', updatePosition, false);
        } else {
            document.removeEventListener('mousemove', updatePosition, false);
        }
    }
    
    function updatePosition(e) {
        const xOffset = e.movementX || e.mozMovementX || 0;
        const yOffset = e.movementY || e.mozMovementY || 0;
        
        camera.processMouseMovement(-xOffset, yOffset);
    }
    
    // Window resize
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        const aspect = canvas.width / canvas.height;
        camera.projectionMatrix.setPerspective(camera.fov, aspect, 0.05, 1000.0);
    });
}

// Process input
function processInput(deltaTime) {
    const nearLadder = checkLadderProximity();
    
    if (isOnLadder && nearLadder) {
        // Ladder climbing mode
        const originalCollisionState = collisionHandler.enabled;
        collisionHandler.enabled = false;
        
        if (camera.velocity && camera.velocity.elements) {
            camera.velocity.elements[1] = 0;
        }
        
        if (keys['KeyW']) {
            camera.position.elements[1] += ladderSpeed * deltaTime;
        }
        if (keys['KeyS']) {
            camera.position.elements[1] -= ladderSpeed * deltaTime;
        }
        
        const ladderMatrix = nearLadder.modelMatrix.elements;
        camera.position.elements[0] = ladderMatrix[12];
        camera.position.elements[2] = ladderMatrix[14];
        
        const minHeight = 0.6;
        const maxHeight = poolRoom.maxHeight + 1.5;
        
        if (camera.position.elements[1] < minHeight) {
            camera.position.elements[1] = minHeight;
        }
        if (camera.position.elements[1] > maxHeight) {
            camera.position.elements[1] = maxHeight;
        }
        
        if (camera.updateCameraVectors) {
            camera.updateCameraVectors();
        }
        
        collisionHandler.enabled = originalCollisionState;
    } else {
        // Normal movement
        if (isOnLadder) {
            isOnLadder = false;
        }
        
        if (keys['KeyW']) {
            camera.processKeyboard('FORWARD', deltaTime);
        }
        if (keys['KeyS']) {
            camera.processKeyboard('BACKWARD', deltaTime);
        }
        if (keys['KeyA']) {
            camera.processKeyboard('LEFT', deltaTime);
        }
        if (keys['KeyD']) {
            camera.processKeyboard('RIGHT', deltaTime);
        }
        
        if (keys['KeyQ']) {
            camera.processKeyboardRotation('LEFT');
        }
        if (keys['KeyE']) {
            camera.processKeyboardRotation('RIGHT');
        }
    }
}

// Main render loop
function render() {
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
    
    // Process input
    processInput(deltaTime);
    
    // Update physics
    camera.updatePhysics(deltaTime);
    
    // Update lighting system
    lightingSystem.update(deltaTime);
    
    // Update collectibles system
    collectibleSystem.update(deltaTime, camera.position.elements);
    
    // Check if underwater
    const isUnderwater = camera.collisionHandler.isInWater(camera.position.elements);
    
    if (isUnderwater) {
        gl.clearColor(0.0, 0.2, 0.4, 1.0);
    } else {
        gl.clearColor(0.9, 0.9, 0.9, 1.0);
    }
    
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Set lighting uniforms
    lightingSystem.setUniforms(gl, program, camera);
    
    // Render the poolroom with lighting
    poolRoom.renderWithLighting(gl, program, camera, lightingSystem);
    
    // Render Assignment 4 objects
    renderAssignment4Objects();
    
    // Render collectibles
    collectibleSystem.render(gl, program, camera, lightingSystem);
    
    // Render light markers
    lightingSystem.renderLightMarkers(gl, program, camera);
    
    // Update status display
    const statusText = `
        FPS: ${fps} | Collision: ${collisionHandler.enabled ? 'ON' : 'OFF'}<br>
        Position: ${camera.position.elements.map(v => v.toFixed(1)).join(', ')}<br>
        Climbing: ${isOnLadder ? 'YES' : 'NO'}<br>
        Lighting: ${lightingSystem.lightingEnabled ? 'ON' : 'OFF'} | Normals: ${lightingSystem.normalVisualization ? 'ON' : 'OFF'}<br>
        Collectibles: ${collectibleSystem.collectedCount}/${collectibleSystem.totalCount}<br>
        Controls: WASD - Move | L - Light | N - Normals | F - Climb | Walk near objects to collect
    `;
    document.getElementById('status').innerHTML = statusText;
    
    // Update FPS counter
    const fpsCounter = document.getElementById('fps-counter');
    if (fpsCounter) {
        fpsCounter.textContent = `FPS: ${fps}`;
    }
    
    requestAnimationFrame(render);
}

// Render Assignment 4 required objects
function renderAssignment4Objects() {
    // Only render if test objects are enabled
    if (!showTestObjects) {
        return;
    }
    
    // Set default texture
    const u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
    gl.uniform1i(u_Sampler, 0);
    
    // Create white texture if needed
    if (!gl.whiteTexture) {
        gl.whiteTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, gl.whiteTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                      new Uint8Array([255, 255, 255, 255]));
    }
    gl.bindTexture(gl.TEXTURE_2D, gl.whiteTexture);
    
    // Set texture scale
    const u_TexScale = gl.getUniformLocation(program, 'u_TexScale');
    gl.uniform2f(u_TexScale, 1.0, 1.0);
    
    // Render test cube (Assignment 4 requirement)
    if (testCube) {
        const u_baseColor = gl.getUniformLocation(program, 'u_baseColor');
        gl.uniform4f(u_baseColor, 0.8, 0.3, 0.3, 1.0); // Red cube
        testCube.render(gl, program, camera.viewMatrix, camera.projectionMatrix, 0.2, lightingSystem);
    }
    
    // Render test sphere (Assignment 4 requirement)
    if (testSphere) {
        const u_baseColor = gl.getUniformLocation(program, 'u_baseColor');
        gl.uniform4f(u_baseColor, 0.3, 0.8, 0.3, 1.0); // Green sphere
        testSphere.render(gl, program, camera.viewMatrix, camera.projectionMatrix, 0.2, lightingSystem);
    }
}

// Add this function to help debug key issues
function resetKeyStates() {
    keys = {};
    console.log('Key states reset');
}

// Add this to your window focus/blur events
window.addEventListener('blur', function() {
    resetKeyStates();
});

window.addEventListener('focus', function() {
    resetKeyStates();
});

// Start the application
window.onload = init;