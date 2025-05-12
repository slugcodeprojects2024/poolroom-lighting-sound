// BlockIndicator class - Shows where a block will be placed/removed

class BlockIndicator {
    constructor(gl) {
        this.gl = gl;
        this.cube = new Cube(gl);
        // Make indicator slightly larger than the actual blocks
        // but still much smaller than original size
        this.cube.setScale(0.36, 0.36, 0.36);
        this.position = { x: 0, y: 0, z: 0 };
        this.visible = true;
        
        // Create wireframe appearance
        this.wireframeColor = { r: 1.0, g: 1.0, b: 1.0, a: 0.7 };
        
        // Current block type
        this.currentBlockType = 0; // 0: Default, 1: Stone, 2: Wood, 3: Glass
        this.blockTypeNames = ['Default', 'Stone', 'Wood', 'Glass'];
    }
    
    // Update position based on camera's front grid position
    update(camera) {
        // Use the new ray casting method instead of just getFrontGridPosition
        const pos = camera.getTargetBlock(5.0, 0.1);
        this.position = pos;
        
        // Update cube position
        this.cube.modelMatrix.setTranslate(pos.x, pos.y, pos.z);
        
        // Set visibility based on valid position
        this.visible = (
            pos.x >= 0 && pos.x < camera.collisionHandler.poolRoom.mapSize &&
            pos.y >= 0 && pos.y < camera.collisionHandler.poolRoom.maxHeight &&
            pos.z >= 0 && pos.z < camera.collisionHandler.poolRoom.mapSize
        );
        
        // Update the scale to match the block size
        this.cube.setScale(0.36, 0.36, 0.36);
    }
    
    // Cycle through available block types
    cycleBlockType() {
        this.currentBlockType = (this.currentBlockType + 1) % this.blockTypeNames.length;
        showNotification(`Block Type: ${this.blockTypeNames[this.currentBlockType]}`, 1500);
        updateBlockTypeIndicator(this.currentBlockType);
        return this.currentBlockType;
    }
    
    // Get current block type
    getCurrentBlockType() {
        return this.currentBlockType;
    }
    
    // Show or hide the indicator
    setVisible(visible) {
        this.visible = visible;
    }
    
    // Render the block indicator with wireframe effect
    render(gl, program, viewMatrix, projectionMatrix) {
        if (!this.visible) return;
        
        // Save current blend state
        const blendEnabled = gl.isEnabled(gl.BLEND);
        
        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Set shader uniforms
        const u_baseColor = gl.getUniformLocation(program, 'u_baseColor');
        const u_texColorWeight = gl.getUniformLocation(program, 'u_texColorWeight');
        const u_TexScale = gl.getUniformLocation(program, 'u_TexScale');
        
        // Different colors based on block type
        let color;
        switch(this.currentBlockType) {
            case 1: // Stone
                color = { r: 0.7, g: 0.7, b: 0.7, a: 0.7 };
                break;
            case 2: // Wood
                color = { r: 0.8, g: 0.5, b: 0.3, a: 0.7 };
                break;
            case 3: // Glass
                color = { r: 0.6, g: 0.8, b: 1.0, a: 0.4 };
                break;
            default: // Default
                color = { r: 1.0, g: 1.0, b: 1.0, a: 0.7 };
        }
        
        // Set color and texture weight
        gl.uniform4f(u_baseColor, color.r, color.g, color.b, color.a);
        gl.uniform1f(u_texColorWeight, 0.1); // Mostly use base color for wireframe effect
        gl.uniform2f(u_TexScale, 1.0, 1.0);
        
        // Draw in wireframe style with base color
        this.cube.render(gl, program, viewMatrix, projectionMatrix, 0.1);
        
        // Restore blend state
        if (!blendEnabled) {
            gl.disable(gl.BLEND);
        }
    }
}

// Global UI helper functions
function showNotification(message, duration = 3000) {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.style.opacity = '1';
        
        // Hide after duration
        setTimeout(() => {
            notification.style.opacity = '0';
        }, duration);
    }
}

function updateBlockTypeIndicator(blockTypeIndex) {
    const indicator = document.getElementById('block-type-indicator');
    if (indicator) {
        const typeNames = ['Default', 'Stone', 'Wood', 'Glass'];
        const typeColors = ['#FFFFFF', '#AAAAAA', '#D2916C', '#9CCEFF'];
        
        indicator.textContent = typeNames[blockTypeIndex];
        indicator.style.backgroundColor = typeColors[blockTypeIndex];
        
        // Adjust text color for better contrast
        if (blockTypeIndex === 3) { // Glass - use dark text
            indicator.style.color = '#333333';
        } else {
            indicator.style.color = '#FFFFFF';
        }
    }
}