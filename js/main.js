// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize the engine
    const engine = new Engine();
    
    if (engine.init()) {
        console.log('Engine initialized successfully');
    } else {
        console.error('Failed to initialize engine');
        document.getElementById('loading-screen').innerHTML = 'Failed to initialize the game engine. Please check if your browser supports WebGL.';
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        engine.resize();
    });
});