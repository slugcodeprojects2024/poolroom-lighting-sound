export class InputManager {
    constructor() {
        this.pressedKeys = new Set();
        this._initListeners();
    }

    _initListeners() {
        document.addEventListener('keydown', (event) => {
            this.pressedKeys.add(event.key.toLowerCase());
        });

        document.addEventListener('keyup', (event) => {
            this.pressedKeys.delete(event.key.toLowerCase());
        });

        // Optional: Clear keys if window loses focus
        window.addEventListener('blur', () => {
            this.pressedKeys.clear();
        });
    }

    isKeyPressed(key) {
        return this.pressedKeys.has(key.toLowerCase());
    }

    // Helper for movement, can be expanded
    getMoveDirection() {
        let forward = 0;
        let right = 0;

        if (this.isKeyPressed('w')) forward += 1;
        if (this.isKeyPressed('s')) forward -= 1;
        if (this.isKeyPressed('a')) right -= 1;
        if (this.isKeyPressed('d')) right += 1;
        
        return { forward, right };
    }

    isJumping() {
        return this.isKeyPressed(' '); // Space bar for jump
    }

    isClimbingUp() {
        return this.isKeyPressed('w');
    }

    isClimbingDown() {
        return this.isKeyPressed('s');
    }
} 