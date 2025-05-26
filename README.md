# Virtual World - Assignment 4: Lighting

## Overview

This project is a 3D interactive virtual environment created using WebGL, featuring advanced Phong lighting and interactive illumination. Building on Assignment 3's pool room environment, this project now includes dynamic point lighting, spot lighting, and realistic material shading using proper vertex normals and fragment-based lighting calculations.

## Core Lighting Features

### Phong Lighting Implementation
- **Point Light**: Dynamic point light that moves around the world (animated and slider-controlled)
- **Spot Light**: Focused directional lighting with adjustable cone angle and direction
- **Complete Phong Model**: Ambient + Diffuse + Specular lighting components
- **Fragment Shading**: Per-pixel lighting calculations for smooth, realistic illumination
- **Normal Transformation**: Proper normal matrix calculations for world coordinate lighting

### Required Geometric Objects
- **Cube**: Basic geometry with manually calculated face normals
- **Sphere**: Procedurally generated sphere mesh with position-based normals
- **Light Marker**: Visual cube indicator at light position for debugging
- **World Objects**: All existing pool room geometry (walls, ground, pillars) with lighting

### Lighting Controls & Visualization
- **Lighting Toggle**: Button to turn lighting system on/off
- **Normal Visualization**: Button to display vertex normals as colors for debugging
- **Light Movement**: Automatic animation plus manual slider control
- **Light Color**: Slider to change the color/intensity of the light source
- **Individual Light Control**: Separate toggles for point light and spot light

## Navigation & Movement
- **Movement**: WASD keys for moving forward, backward, left, and right
- **Look Around**: Mouse movement to control the camera direction
- **Camera Rotation**: Q/E keys for additional camera rotation
- **Jumping**: Space bar to jump
- **Sprinting**: Hold Shift to run faster (with stamina system)
- **Ladder Climbing**: Click or press F near ladders to climb, W/S to go up/down

## Environment Features
- **Pool with Water Physics**: Jump in and experience different movement mechanics underwater
- **Ladder System**: Climb ladders in each corner to reach different levels
- **Physics System**: Gravity, jumping, and collision detection
- **Collision Detection**: Smart collision system with ladder climbing support
- **Stamina System**: Limited sprint duration with visual indicator

## Technical Implementation Details

### Shader System
- **Vertex Shader**: Transforms positions, normals, and passes lighting data to fragment shader
- **Fragment Shader**: Implements full Phong shading model with ambient, diffuse, and specular components
- **Normal Attributes**: Each vertex includes a normal vector for proper lighting calculations
- **World Coordinate Lighting**: All lighting calculations performed in world space using normal matrix transformations

### Lighting Mathematics
- **Normal Matrix**: Calculated to properly transform normals to world coordinates
- **Light Vector Calculation**: Per-vertex light direction from light position to world position
- **Phong Components**:
  - **Ambient**: Base illumination level (hard-coded coefficient)
  - **Diffuse**: Lambert's law implementation (N · L)
  - **Specular**: Phong reflection model with view-dependent highlights

### Geometry Generation
- **Cube Normals**: Manually calculated face normals for each cube face
- **Sphere Generation**: Procedural sphere mesh using spherical coordinates with trigonometry
- **Sphere Normals**: Position-based normals (Normal = Position for origin-centered sphere)
- **Buffer Management**: Separate vertex buffers for positions, texture coordinates, and normals

## Visual Effects
- **Phong Illumination**: Realistic lighting with highlights and shadows
- **Textured Surfaces**: Detailed textures combined with lighting
- **Skybox**: Immersive sky background
- **Transparent Water & Glass**: Semi-transparent rendering with lighting
- **Dynamic Shadows**: Lighting creates realistic depth and dimension

## Controls Summary
```
Movement:     WASD - Move | Mouse - Look | Q/E - Rotate
Actions:      Space - Jump | Shift - Sprint
Climbing:     F/Click - Grab Ladder | W/S - Climb Up/Down
Lighting:     L - Toggle Lighting | N - Toggle Normals
              Light Color/Position Sliders in UI
Settings:     C - Toggle Collision
```

## Technical Implementation

### Core Graphics
- Built with raw WebGL for graphics rendering
- Custom 3D math libraries for matrix and vector operations
- Advanced shader programming with vertex and fragment shaders

### Lighting System
- Phong lighting model implementation
- Multiple light source support (point + spot)
- Normal vector computation and transformation
- Material property system

### Geometry & Physics
- Procedural sphere generation with proper normals
- Collision detection system with ceiling support
- Ladder climbing mechanics
- First-person camera controls with physics

## Getting Started
1. Open index.html in a web browser that supports WebGL
2. Click on the canvas to enable pointer lock (gives control of the camera)
3. Use WASD to move and the mouse to look around
4. **Test the lighting system**:
   - Press L to toggle lighting on/off
   - Press N to visualize surface normals (objects will appear colored by their normals)
   - Use the light position sliders to move the point light around
   - Use the light color slider to change the light color
   - Toggle individual lights (point light and spot light) on/off
5. **Observe the lighting effects**:
   - Look at the sphere to see clear diffuse and specular highlights
   - Watch how the light marker cube moves around the scene
   - Notice how all surfaces respond to the moving light source
6. **Explore the world**:
   - Find ladders in the corners and press F to climb them
   - Experience the full pool room environment with realistic lighting

## Development Notes
- Built following the step-by-step tutorial approach from the assignment
- Started with basic cube and sphere geometry
- Added normal calculation and visualization for debugging
- Implemented basic lighting, then enhanced to full Phong model
- Integrated lighting with existing Assignment 3 world
- Added spot light as additional requirement
- Supports optional OBJ model loading for extra credit

## Assignment 4 Requirements Completed
- Cube with proper normals
- Sphere geometry with calculated normals  
- Moving point light with visual marker
- Phong shading (ambient + diffuse + specular)
- Camera movement controls
- Lighting on/off toggle
- Normal visualization toggle
- Spot light implementation
- Individual light controls
- Dynamic light animation

## Requirements
- Modern web browser with WebGL support
- Keyboard and mouse
- WebGL-compatible graphics card

---

*This project was created as part of CSE 160 (Introduction to Computer Graphics) coursework, progressing from Assignment 3 (Virtual World) to Assignment 4 (Lighting).*