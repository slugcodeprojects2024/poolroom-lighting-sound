# Virtual World - Assignment 3

## Overview

This project is a 3D interactive virtual environment created using WebGL. It features a pool room with customizable elements where users can navigate, interact with the environment, and place blocks to create their own structures.

## Features

### Navigation
- **Movement**: WASD keys for moving forward, backward, left, and right
- **Look Around**: Mouse movement to control the camera direction
- **Camera Rotation**: Q/E keys for additional camera rotation
- **Jumping**: Space bar to jump
- **Sprinting**: Hold Shift to run faster (with stamina system)

### Building System
- **Block Placement**: Left-click or F key to place blocks
- **Block Removal**: Right-click or G key to remove the last placed block
- **Block Types**: Cycle through different block materials (Default, Stone, Wood, Glass) using B key
- **Block Indicator**: Visual indicator shows where blocks will be placed

### Environment
- **Pool with Water Physics**: Jump in and experience different movement mechanics underwater
- **Physics System**: Gravity, jumping, and collision detection
- **Collision Toggling**: Press C to toggle collision detection on/off
- **Stamina System**: Limited sprint duration with visual indicator

### Visual Effects
- **Textured Surfaces**: Detailed textures for different surfaces and materials
- **Skybox**: Immersive sky background
- **Lighting**: Basic lighting system to enhance visual appearance
- **Transparent Water & Glass**: Semi-transparent rendering for water and glass blocks

## Controls Summary
```
Movement:     WASD - Move
Camera:       Mouse - Look | Q/E - Rotate
Actions:      Space - Jump | Shift - Sprint
Building:     Left Click/F - Place Block | Right Click/G - Remove Block
Settings:     B - Cycle Block Types | C - Toggle Collision
```

## Technical Implementation
- Built with raw WebGL for graphics rendering
- Custom 3D math libraries for matrix and vector operations
- Collision detection system for environment interaction
- Texture loading and management system
- First-person camera controls with physics

## Getting Started
1. Open index.html in a web browser that supports WebGL
2. Click on the canvas to enable pointer lock (gives control of the camera)
3. Use WASD to move and the mouse to look around
4. Try jumping with Space and sprinting with Shift
5. Place blocks with left-click or F key, and remove them with right-click or G key

## Requirements
- Modern web browser with WebGL support
- Keyboard and mouse

---

*This project was created as part of CSE 160 (Introduction to Computer Graphics) coursework.*