/**
 * A two-dimensional vector.
 */
export class Vector2 {
    /**
     * Construct a `Vector2` from two coordinates.
     * @param {number} x The X value.
     * @param {number} y The Y value.
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * @returns The zero vector.
     */
    static zero() {
        return new Vector2(0, 0);
    }

    /**
     * Returns a copy of the given `Vector2`.
     */
    static copy(base) {
        return new Vector2(base.x, base.y);
    }

    /**
     * @param {Vector2} other The `Vector2` to add.
     * @returns The sum of this `Vector2` and another `Vector2`.
     */
    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    /**
     * @param {number} scalar The scalar to multiply.
     * @returns The product of this `Vector2` and `scalar`.
     */
    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    /**
     * @param {Vector2} other The `Vector2` to dot with.
     * @returns The dot product of this `Vector2` and another `Vector2`.
     */
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    /**
     * @returns The magnitude of this `Vector2`.
     */
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * @returns This `Vector2`, normalized so that length = 1.
     */
    normalized() {
        let mag = this.magnitude();
        // if (mag.x === 0 && mag.y === 0)
        //     return Vector2.zero();
        return new Vector2(this.x / mag, this.y / mag);
    }

    /**
     * @param {Vector2} other The `Vector2` to compare.
     * @returns True if this `Vector2` has the same components as `other`, false otherwise.
     */
    equals(other) {
        return this.x === other.x && this.y === other.y;            
    }

    /**
     * @returns The string representation of this `Vector2`.
     */
    toString() {
        return `(${this.x}, ${this.y})`
    }
}

/**
* Construct a Vector2 from an angle in radians.
* @param {number} angle The angle in radians.
*/
export function vectorFromAngle(angle) {
   return new Vector2(Math.cos(angle), Math.sin(angle));
}