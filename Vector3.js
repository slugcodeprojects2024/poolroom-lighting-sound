export class Vector3 {
    constructor(elements = [0, 0, 0]) {
        if (elements instanceof Vector3) {
            this.elements = new Float32Array(elements.elements);
        } else if ((Array.isArray(elements) || elements instanceof Float32Array) && elements.length === 3) {
            this.elements = new Float32Array(elements);
        } else {
            this.elements = new Float32Array([0, 0, 0]);
            console.warn("Vector3: Invalid constructor argument. Defaulting to [0,0,0].");
        }
    }

    set(otherVector) {
        if (otherVector instanceof Vector3) {
            this.elements[0] = otherVector.elements[0];
            this.elements[1] = otherVector.elements[1];
            this.elements[2] = otherVector.elements[2];
        } else if (Array.isArray(otherVector) && otherVector.length === 3) {
            this.elements[0] = otherVector[0];
            this.elements[1] = otherVector[1];
            this.elements[2] = otherVector[2];
        }
        return this;
    }

    add(otherVector) {
        this.elements[0] += otherVector.elements[0];
        this.elements[1] += otherVector.elements[1];
        this.elements[2] += otherVector.elements[2];
        return this;
    }

    sub(otherVector) {
        this.elements[0] -= otherVector.elements[0];
        this.elements[1] -= otherVector.elements[1];
        this.elements[2] -= otherVector.elements[2];
        return this;
    }

    mul(scalar) {
        this.elements[0] *= scalar;
        this.elements[1] *= scalar;
        this.elements[2] *= scalar;
        return this;
    }

    div(scalar) {
        if (scalar !== 0) {
            this.elements[0] /= scalar;
            this.elements[1] /= scalar;
            this.elements[2] /= scalar;
        } else {
            console.error("Vector3: Division by zero.");
        }
        return this;
    }

    magnitude() {
        return Math.sqrt(
            this.elements[0] * this.elements[0] +
            this.elements[1] * this.elements[1] +
            this.elements[2] * this.elements[2]
        );
    }

    normalize() {
        const mag = this.magnitude();
        if (mag > 0.00001) { // Avoid division by zero or very small numbers
            this.div(mag);
        }
        return this;
    }

    static cross(v1, v2) {
        const x = v1.elements[1] * v2.elements[2] - v1.elements[2] * v2.elements[1];
        const y = v1.elements[2] * v2.elements[0] - v1.elements[0] * v2.elements[2];
        const z = v1.elements[0] * v2.elements[1] - v1.elements[1] * v2.elements[0];
        return new Vector3([x, y, z]);
    }

    clone() {
        return new Vector3(this.elements);
    }
} 