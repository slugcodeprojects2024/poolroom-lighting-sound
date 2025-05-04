// poolRoom.js - Improved room-based pool environment generator

class PoolRoom {
    constructor(seed = 12345) {
        this.seed = seed;
        this.rng = this.createRNG(seed);
        this.rooms = [];
        this.corridors = [];
        this.doorways = [];
        
        // Generate the layout
        this.generateLayout();
    }
    
    // Simple random number generator with seed
    createRNG(seed) {
        return () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }
    
    // Generate a random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(min + this.rng() * (max - min + 1));
    }
    
    // Add this method which is used by the collision system
    hasAdjacentRoom(room, direction) {
        const allSpaces = [...this.rooms, ...this.corridors];
        
        // Check if there's another room in the specified direction
        for (const other of allSpaces) {
            if (room === other) continue;
            
            switch (direction) {
                case 'north': // Check for a room to the north (lower z)
                    if (Math.abs(room.x - other.x) < 0.1 || 
                        (other.x <= room.x + room.width && room.x <= other.x + other.width)) {
                        if (Math.abs(room.z - (other.z + other.length)) < 1) {
                            return true;
                        }
                    }
                    break;
                case 'south': // Check for a room to the south (higher z)
                    if (Math.abs(room.x - other.x) < 0.1 || 
                        (other.x <= room.x + room.width && room.x <= other.x + other.width)) {
                        if (Math.abs((room.z + room.length) - other.z) < 1) {
                            return true;
                        }
                    }
                    break;
                case 'east': // Check for a room to the east (higher x)
                    if (Math.abs(room.z - other.z) < 0.1 || 
                        (other.z <= room.z + room.length && room.z <= other.z + other.length)) {
                        if (Math.abs((room.x + room.width) - other.x) < 1) {
                            return true;
                        }
                    }
                    break;
                case 'west': // Check for a room to the west (lower x)
                    if (Math.abs(room.z - other.z) < 0.1 || 
                        (other.z <= room.z + room.length && room.z <= other.z + other.length)) {
                        if (Math.abs(room.x - (other.x + other.width)) < 1) {
                            return true;
                        }
                    }
                    break;
            }
        }
        
        // Check if there's a doorway in this direction
        for (const door of this.doorways) {
            if (direction === 'east' && 
                Math.abs(door.x - (room.x + room.width)) < 1 &&
                door.z >= room.z && door.z <= room.z + room.length) {
                return true;
            } else if (direction === 'west' && 
                      Math.abs(door.x - room.x) < 1 &&
                      door.z >= room.z && door.z <= room.z + room.length) {
                return true;
            } else if (direction === 'north' && 
                      Math.abs(door.z - room.z) < 1 &&
                      door.x >= room.x && door.x <= room.x + room.width) {
                return true;
            } else if (direction === 'south' && 
                      Math.abs(door.z - (room.z + room.length)) < 1 &&
                      door.x >= room.x && door.x <= room.x + room.width) {
                return true;
            }
        }
        
        return false;
    }
    
    generateLayout() {
        // Define room types and their parameters
        const roomTypes = {
            MAIN_POOL: {
                width: { min: 18, max: 25 },
                length: { min: 25, max: 35 },
                height: { min: 5, max: 7 },
                hasPool: true,
                poolDepth: { min: 2, max: 3 }
            },
            KIDS_POOL: {
                width: { min: 10, max: 15 },
                length: { min: 12, max: 18 },
                height: { min: 4, max: 5 },
                hasPool: true,
                poolDepth: { min: 0.8, max: 1.2 }
            },
            LOCKER_ROOM: {
                width: { min: 8, max: 12 },
                length: { min: 10, max: 15 },
                height: { min: 3, max: 4 },
                hasPool: false
            },
            SHOWER_ROOM: {
                width: { min: 6, max: 8 },
                length: { min: 8, max: 10 },
                height: { min: 3, max: 3.5 },
                hasPool: false
            },
            HALLWAY: {
                width: { min: 4, max: 6 },
                length: { min: 6, max: 20 },
                height: { min: 3, max: 4 },
                hasPool: false
            }
        };
        
        // Create a main pool room (center of our complex)
        const mainPoolParams = roomTypes.MAIN_POOL;
        const mainPool = {
            type: 'MAIN_POOL',
            id: 'main_pool',
            x: 0,
            y: 0,
            z: 0,
            width: this.randomInt(mainPoolParams.width.min, mainPoolParams.width.max),
            length: this.randomInt(mainPoolParams.length.min, mainPoolParams.length.max),
            height: this.randomInt(mainPoolParams.height.min, mainPoolParams.height.max),
            hasPool: true,
            poolDepth: this.randomInt(mainPoolParams.poolDepth.min, mainPoolParams.poolDepth.max)
        };
        
        // Add main pool room
        this.rooms.push(mainPool);
        
        // Create a locker room connected to the main pool
        const lockerParams = roomTypes.LOCKER_ROOM;
        const lockerRoom = {
            type: 'LOCKER_ROOM',
            id: 'locker_room',
            x: mainPool.x + mainPool.width + 5, // Place to the right of main pool with a gap for hallway
            y: 0,
            z: mainPool.z + (mainPool.length - lockerParams.length.max) / 2, // Center along z-axis
            width: this.randomInt(lockerParams.width.min, lockerParams.width.max),
            length: this.randomInt(lockerParams.length.min, lockerParams.length.max),
            height: this.randomInt(lockerParams.height.min, lockerParams.height.max),
            hasPool: false
        };
        
        // Add locker room
        this.rooms.push(lockerRoom);
        
        // Create a shower room connected to the locker room
        const showerParams = roomTypes.SHOWER_ROOM;
        const showerRoom = {
            type: 'SHOWER_ROOM',
            id: 'shower_room',
            x: lockerRoom.x + lockerRoom.width / 2 - showerParams.width.max / 2, // Center on locker room
            y: 0,
            z: lockerRoom.z + lockerRoom.length + 2, // Place behind locker room with a small gap
            width: this.randomInt(showerParams.width.min, showerParams.width.max),
            length: this.randomInt(showerParams.length.min, showerParams.length.max),
            height: this.randomInt(showerParams.height.min, showerParams.height.max),
            hasPool: false
        };
        
        // Add shower room
        this.rooms.push(showerRoom);
        
        // Add a kids pool to the left of the main pool
        const kidsPoolParams = roomTypes.KIDS_POOL;
        const kidsPool = {
            type: 'KIDS_POOL',
            id: 'kids_pool',
            x: mainPool.x - kidsPoolParams.width.max - 5, // Place to the left of main pool with a gap for hallway
            y: 0,
            z: mainPool.z + (mainPool.length - kidsPoolParams.length.max) / 2, // Center along z-axis
            width: this.randomInt(kidsPoolParams.width.min, kidsPoolParams.width.max),
            length: this.randomInt(kidsPoolParams.length.min, kidsPoolParams.length.max),
            height: this.randomInt(kidsPoolParams.height.min, kidsPoolParams.height.max),
            hasPool: true,
            poolDepth: this.randomInt(kidsPoolParams.poolDepth.min, kidsPoolParams.poolDepth.max)
        };
        
        // Add kids pool
        this.rooms.push(kidsPool);
        
        // Create hallways to connect rooms
        this.createHallways();
        
        // Create doorways between adjacent rooms and hallways
        this.createDoorways();
    }
    
    createHallways() {
        const hallwayParams = {
            width: 4,
            height: 3
        };
        
        // Find main pool and locker room
        const mainPool = this.rooms.find(room => room.id === 'main_pool');
        const lockerRoom = this.rooms.find(room => room.id === 'locker_room');
        const kidsPool = this.rooms.find(room => room.id === 'kids_pool');
        
        if (mainPool && lockerRoom) {
            // Create hallway from main pool to locker room
            const hallway1 = {
                type: 'HALLWAY',
                id: 'hallway_main_to_locker',
                x: mainPool.x + mainPool.width,
                y: 0,
                z: mainPool.z + mainPool.length / 2 - hallwayParams.width / 2,
                width: lockerRoom.x - (mainPool.x + mainPool.width),
                length: hallwayParams.width,
                height: hallwayParams.height,
                hasPool: false
            };
            
            this.corridors.push(hallway1);
        }
        
        if (mainPool && kidsPool) {
            // Create hallway from main pool to kids pool
            const hallway2 = {
                type: 'HALLWAY',
                id: 'hallway_main_to_kids',
                x: kidsPool.x + kidsPool.width,
                y: 0,
                z: mainPool.z + mainPool.length / 2 - hallwayParams.width / 2,
                width: mainPool.x - (kidsPool.x + kidsPool.width),
                length: hallwayParams.width,
                height: hallwayParams.height,
                hasPool: false
            };
            
            this.corridors.push(hallway2);
        }
    }
    
    createDoorways() {
        // Simple doorway creation - mark locations where doors should be
        // For each hallway, create doorways at both ends
        for (const hallway of this.corridors) {
            if (hallway.id === 'hallway_main_to_locker') {
                // Doorway at main pool end
                this.doorways.push({
                    x: hallway.x,
                    y: 0,
                    z: hallway.z + hallway.length / 2,
                    width: 1,
                    height: 2.5,
                    direction: 'east-west'
                });
                
                // Doorway at locker room end
                this.doorways.push({
                    x: hallway.x + hallway.width,
                    y: 0,
                    z: hallway.z + hallway.length / 2,
                    width: 1,
                    height: 2.5,
                    direction: 'east-west'
                });
            }
            
            if (hallway.id === 'hallway_main_to_kids') {
                // Doorway at kids pool end
                this.doorways.push({
                    x: hallway.x,
                    y: 0,
                    z: hallway.z + hallway.length / 2,
                    width: 1,
                    height: 2.5,
                    direction: 'east-west'
                });
                
                // Doorway at main pool end
                this.doorways.push({
                    x: hallway.x + hallway.width,
                    y: 0,
                    z: hallway.z + hallway.length / 2,
                    width: 1,
                    height: 2.5,
                    direction: 'east-west'
                });
            }
        }
    }
    
    // Check if a position is inside or near a doorway
    isInDoorway(x, y, z, tolerance = 2) {
        for (const door of this.doorways) {
            if (door.direction === 'east-west') {
                if (Math.abs(x - door.x) < tolerance &&
                    y >= door.y && y <= door.y + door.height &&
                    Math.abs(z - door.z) < door.width / 2 + tolerance) {
                    return true;
                }
            } else { // north-south
                if (Math.abs(z - door.z) < tolerance &&
                    y >= door.y && y <= door.y + door.height &&
                    Math.abs(x - door.x) < door.width / 2 + tolerance) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Build the world representation with cubes for WebGL
    buildWorldRepresentation(gl) {
        const objects = [];
        
        // Combine rooms and corridors for rendering
        const allSpaces = [...this.rooms, ...this.corridors];
        
        // Create all room elements
        for (const space of allSpaces) {
            // Create floor
            const floor = new Cube(gl);
            floor.setPosition(
                space.x + space.width/2, 
                space.y - 0.5, 
                space.z + space.length/2
            );
            floor.setScale(space.width, 1, space.length);
            objects.push({
                cube: floor,
                type: 'floor',
                roomType: space.type
            });
            
            // Create ceiling
            const ceiling = new Cube(gl);
            ceiling.setPosition(
                space.x + space.width/2, 
                space.y + space.height, 
                space.z + space.length/2
            );
            ceiling.setScale(space.width, 1, space.length);
            objects.push({
                cube: ceiling,
                type: 'ceiling',
                roomType: space.type
            });
            
            // Create walls (breaking them into segments to allow for doorways)
            this.createWallSegments(gl, space, objects);
            
            // If room has a pool, create it
            if (space.hasPool) {
                this.createPool(gl, space, objects);
            }
        }
        
        return objects;
    }
    
    // Create wall segments with gaps for doorways
    createWallSegments(gl, space, objects) {
        const wallThickness = 1;
        const segmentSize = 4; // Size of wall segments
        
        // North wall (segmented)
        for (let x = 0; x < space.width; x += segmentSize) {
            const segWidth = Math.min(segmentSize, space.width - x);
            const wx = space.x + x + segWidth/2;
            const wz = space.z;
            
            // Skip if this position is in a doorway
            if (!this.isInDoorway(wx, space.y + space.height/2, wz)) {
                const northWall = new Cube(gl);
                northWall.setPosition(
                    wx,
                    space.y + space.height/2,
                    wz
                );
                northWall.setScale(segWidth, space.height, wallThickness);
                objects.push({
                    cube: northWall,
                    type: 'wall',
                    roomType: space.type
                });
            }
        }
        
        // South wall (segmented)
        for (let x = 0; x < space.width; x += segmentSize) {
            const segWidth = Math.min(segmentSize, space.width - x);
            const wx = space.x + x + segWidth/2;
            const wz = space.z + space.length;
            
            // Skip if this position is in a doorway
            if (!this.isInDoorway(wx, space.y + space.height/2, wz)) {
                const southWall = new Cube(gl);
                southWall.setPosition(
                    wx,
                    space.y + space.height/2,
                    wz
                );
                southWall.setScale(segWidth, space.height, wallThickness);
                objects.push({
                    cube: southWall,
                    type: 'wall',
                    roomType: space.type
                });
            }
        }
        
        // East wall (segmented)
        for (let z = 0; z < space.length; z += segmentSize) {
            const segLength = Math.min(segmentSize, space.length - z);
            const wz = space.z + z + segLength/2;
            const wx = space.x + space.width;
            
            // Skip if this position is in a doorway
            if (!this.isInDoorway(wx, space.y + space.height/2, wz)) {
                const eastWall = new Cube(gl);
                eastWall.setPosition(
                    wx,
                    space.y + space.height/2,
                    wz
                );
                eastWall.setScale(wallThickness, space.height, segLength);
                objects.push({
                    cube: eastWall,
                    type: 'wall',
                    roomType: space.type
                });
            }
        }
        
        // West wall (segmented)
        for (let z = 0; z < space.length; z += segmentSize) {
            const segLength = Math.min(segmentSize, space.length - z);
            const wz = space.z + z + segLength/2;
            const wx = space.x;
            
            // Skip if this position is in a doorway
            if (!this.isInDoorway(wx, space.y + space.height/2, wz)) {
                const westWall = new Cube(gl);
                westWall.setPosition(
                    wx,
                    space.y + space.height/2,
                    wz
                );
                westWall.setScale(wallThickness, space.height, segLength);
                objects.push({
                    cube: westWall,
                    type: 'wall',
                    roomType: space.type
                });
            }
        }
    }
    
    // Create pool features for rooms that have pools
    createPool(gl, room, objects) {
        // Pool dimensions (slightly smaller than the room)
        const poolMargin = 3;
        const poolWidth = room.width - poolMargin * 2;
        const poolLength = room.length - poolMargin * 2;
        
        // Water surface
        const waterSurface = new Cube(gl);
        waterSurface.setPosition(
            room.x + room.width/2,
            room.y, // Water surface at room level
            room.z + room.length/2
        );
        waterSurface.setScale(poolWidth, 0.1, poolLength);
        objects.push({
            cube: waterSurface,
            type: 'water',
            roomType: room.type
        });
        
        // Pool floor
        const poolFloor = new Cube(gl);
        poolFloor.setPosition(
            room.x + room.width/2,
            room.y - room.poolDepth,
            room.z + room.length/2
        );
        poolFloor.setScale(poolWidth, 0.1, poolLength);
        objects.push({
            cube: poolFloor,
            type: 'pool_floor',
            roomType: room.type
        });
        
        // Pool walls
        // North pool wall
        const northPoolWall = new Cube(gl);
        northPoolWall.setPosition(
            room.x + room.width/2,
            room.y - room.poolDepth/2,
            room.z + poolMargin
        );
        northPoolWall.setScale(poolWidth, room.poolDepth, 0.1);
        objects.push({
            cube: northPoolWall,
            type: 'pool_wall',
            roomType: room.type
        });
        
        // South pool wall
        const southPoolWall = new Cube(gl);
        southPoolWall.setPosition(
            room.x + room.width/2,
            room.y - room.poolDepth/2,
            room.z + room.length - poolMargin
        );
        southPoolWall.setScale(poolWidth, room.poolDepth, 0.1);
        objects.push({
            cube: southPoolWall,
            type: 'pool_wall',
            roomType: room.type
        });
        
        // East pool wall
        const eastPoolWall = new Cube(gl);
        eastPoolWall.setPosition(
            room.x + room.width - poolMargin,
            room.y - room.poolDepth/2,
            room.z + room.length/2
        );
        eastPoolWall.setScale(0.1, room.poolDepth, poolLength);
        objects.push({
            cube: eastPoolWall,
            type: 'pool_wall',
            roomType: room.type
        });
        
        // West pool wall
        const westPoolWall = new Cube(gl);
        westPoolWall.setPosition(
            room.x + poolMargin,
            room.y - room.poolDepth/2,
            room.z + room.length/2
        );
        westPoolWall.setScale(0.1, room.poolDepth, poolLength);
        objects.push({
            cube: westPoolWall,
            type: 'pool_wall',
            roomType: room.type
        });
        
        // Add pool ladder
        if (room.type === 'MAIN_POOL') {
            const ladderDepth = 0.3;
            const ladderWidth = 0.8;
            
            // North ladder
            const northLadder = new Cube(gl);
            northLadder.setPosition(
                room.x + room.width/2 + 5, // Offset from center
                room.y - room.poolDepth/2,
                room.z + poolMargin + ladderDepth
            );
            northLadder.setScale(ladderWidth, room.poolDepth, ladderDepth);
            objects.push({
                cube: northLadder,
                type: 'ladder',
                roomType: room.type
            });
            
            // Add diving board (only for main pool)
            const divingBoard = new Cube(gl);
            divingBoard.setPosition(
                room.x + room.width/2,
                room.y + 0.5,
                room.z + room.length - poolMargin - 4 // Position properly inside the pool area
            );
            divingBoard.setScale(2, 0.2, 4);
            objects.push({
                cube: divingBoard,
                type: 'diving_board',
                roomType: room.type
            });
            
            // Diving board stand
            const divingStand = new Cube(gl);
            divingStand.setPosition(
                room.x + room.width/2,
                room.y,
                room.z + room.length - poolMargin - 6
            );
            divingStand.setScale(1, 1, 1);
            objects.push({
                cube: divingStand,
                type: 'diving_stand',
                roomType: room.type
            });
        }
    }
}