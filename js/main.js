document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed"); // Add this log for confirmation

    const engine = new Engine('game-canvas'); // ID of your canvas element

    // Check if engine initialization was successful (WebGL context obtained)
    if (engine && engine.gl) {
        engine.init();  // Initialize shaders, geometry, world, etc.
        engine.start(); // Start the game loop

        // --- HIDE THE LOADING OVERLAY ---
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden'); // Add the 'hidden' class
            console.log("Loading screen hidden."); // Optional confirmation log
        }
        // --- End hide loading overlay ---

    } else {
        console.error("Failed to initialize the engine or get WebGL context.");
        // Optionally display an error message to the user on the page
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.textContent = 'Error: WebGL not supported or engine failed to initialize.';
            // Don't hide the loading screen if there's an error
        }
    }
});