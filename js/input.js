class InputManager {
    constructor() {
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.mouseButtons = [false, false, false];
        
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners for keyboard and mouse
     */
    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse movement
        window.addEventListener('mousemove', (e) => {
            const newX = e.clientX;
            const newY = e.clientY;
            
            this.mouseDeltaX = newX - this.mouseX;
            this.mouseDeltaY = newY - this.mouseY;
            
            this.mouseX = newX;
            this.mouseY = newY;
        });
        
        // Mouse buttons
        window.addEventListener('mousedown', (e) => {
            this.mouseButtons[e.button] = true;
        });
        
        window.addEventListener('mouseup', (e) => {
            this.mouseButtons[e.button] = false;
        });
        
        // Prevent context menu on right-click
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    /**
     * Check if a key is currently pressed
     * @param {string} code - Key code (e.g., 'KeyW', 'ArrowUp')
     * @returns {boolean} - Whether the key is pressed
     */
    isKeyPressed(code) {
        return this.keys[code] === true;
    }
    
    /**
     * Check if any of the given keys is pressed
     * @param {Array<string>} codes - Array of key codes
     * @returns {boolean} - Whether any key is pressed
     */
    isAnyKeyPressed(codes) {
        return codes.some(code => this.isKeyPressed(code));
    }
    
    /**
     * Get mouse movement since last frame
     * @returns {Object} - Mouse movement data
     */
    getMouseMovement() {
        const movement = {
            deltaX: this.mouseDeltaX,
            deltaY: this.mouseDeltaY
        };
        
        // Reset deltas for next frame
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        
        return movement;
    }
    
    /**
     * Check if a mouse button is pressed
     * @param {number} button - Button index (0: left, 1: middle, 2: right)
     * @returns {boolean} - Whether the button is pressed
     */
    isMouseButtonPressed(button) {
        return this.mouseButtons[button] === true;
    }
}