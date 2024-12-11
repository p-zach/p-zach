import { Vector2, vectorFromAngle } from "../Vector2";

const SPEED_MAX = 15000;

const ACCEL_BACKWARD = 200;
const ACCEL_FORWARD = 300;

const TURN_SCALAR = 5;

const FRICTION_STRENGTH = 200;
const FRICTION_PARALLEL = 0.05;
const FRICTION_PERPENDICULAR = 0.7;

export class CarModel {
    constructor(origin) {
        this.position = Vector2.copy(origin);
        this.previousPosition = Vector2.copy(origin);
        // Velocity is the direction in which the car is currently moving.
        this.velocity = new Vector2(0, 0);
        // Heading is the direction in which the car is currently pointing.
        // Velocity != heading allows for drifting.
        this.heading = 0;
    }

    /**
     * Update the car based on input from a controller.
     * @param {number} forward The amount to accelerate. Range: [0, 1]
     * @param {number} turn The amount to turn. Range: [-1, 1]
     * @param {number} delta The time in seconds since the last frame.
     */
    update(forward, turn, delta) {
        this.accelerate(forward, turn, delta);

        this.previousPosition = Vector2.copy(this.position);
        this.position = this.position.add(this.velocity.multiply(delta));
    }

    /**
     * Accelerate the car based on input from a controller.
     * @param {number} forward The amount to accelerate. Range: [-1, 1]
     * @param {number} turn The amount to turn. Range: [-1, 1]
     * @param {number} delta The time in seconds since the last frame.
     */
    accelerate(forward, turn, delta) {
        // Scale inputs by constants
        let scaledForward = forward > 0 ? ACCEL_FORWARD * forward : ACCEL_BACKWARD * forward;
        let scaledTurn = turn * TURN_SCALAR;

        let direction = vectorFromAngle(this.heading);

        // Apply friction
        if (!this.velocity.equals(Vector2.zero()))
        {
            // Angle between vectors formula
            // Second factor in denominator removed because |direction|=1 always
            let cosTheta = this.velocity.dot(direction) / (this.velocity.magnitude());
            let driftAngle = Math.acos(Math.max(Math.min(cosTheta, 1), -1));
            // Elliptical distance function dictates friction based on direction
            // of wheels compared to direction of velocity
            let parallelFrictionCoef = FRICTION_PARALLEL * Math.cos(driftAngle);
            let perpendicularFrictionCoef = FRICTION_PERPENDICULAR * Math.sin(driftAngle);
            // d = sqrt(a^2 * cos^2 x + b^2 sin^2 x)
            let frictionCoef = Math.sqrt(parallelFrictionCoef * parallelFrictionCoef + perpendicularFrictionCoef * perpendicularFrictionCoef);
            // Apply a force to the car in opposite direction of velocity to simulate friction
            let frictionForce = this.velocity.normalized().multiply(-frictionCoef * FRICTION_STRENGTH * delta);
            if (frictionForce.magnitude() > this.velocity.magnitude())
                this.velocity = Vector2.zero();
            else this.velocity = this.velocity.add(frictionForce);
        }

        // Accelerate and turn
        this.velocity = this.velocity.add(direction.multiply(scaledForward * delta));
        this.heading += scaledTurn * delta;

        // Clamp velocity
        if (this.velocity.magnitude() > SPEED_MAX * delta) {
            this.velocity = this.velocity.normalized().multiply(SPEED_MAX * delta);
        }

    }
}