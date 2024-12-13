import { Vector2, vectorFromAngle } from "../Vector2";
import * as tf from '@tensorflow/tfjs';

const SPEED_MAX = 15000;

const ACCEL_BACKWARD = 200;
const ACCEL_FORWARD = 300;

const TURN_SCALAR = 5;

const FRICTION_STRENGTH = 400;
const FRICTION_PARALLEL = 0.05;
const FRICTION_PERPENDICULAR = 0.7;

const INPUT_LAYER_SIZE = 7;
const OUTPUT_LAYER_SIZE = 2;

export class CarModel {
    constructor(origin, hiddenLayers, initRandom = false) {
        this.reset(origin);

        // Initialize values
        const initializer = initRandom ? tf.initializers.glorotNormal() : tf.initializers.constant({ value: 0 });

        // Create input layer
        this.model = tf.sequential();
        this.model.add(tf.layers.dense({
            units: hiddenLayers[0],
            inputShape: [INPUT_LAYER_SIZE],
            kernelInitializer: initializer, 
            activation: 'relu'
        }));

        // Create hidden layers
        for (let i = 1; i < hiddenLayers.length - 1; i++) {
            this.model.add(tf.layers.dense({
                units: hiddenLayers[i],
                kernelInitializer: initializer, 
                activation: 'relu'
            }));
        }

        // Create output layer
        this.model.add(tf.layers.dense({
            units: OUTPUT_LAYER_SIZE, 
            kernelInitializer: initializer,
            activation: 'softmax'
        }));

        // Compile model
        this.model.compile({optimizer: 'sgd', loss: 'meanSquaredError'});
    }
    
    reset(origin) {
        this.position = Vector2.copy(origin);
        this.previousPosition = Vector2.copy(origin);
        // Velocity is the direction in which the car is currently moving.
        this.velocity = new Vector2(0, 0);
        // Heading is the direction in which the car is currently pointing.
        // Velocity != heading allows for drifting.
        this.heading = 0;
    }

    updateFromModel(delta, env) {
        // Inputs 1-2
        // Transform global car velocity to local where heading is +x
        const headingVector = vectorFromAngle(this.heading);
        const headingComponent = this.velocity.dot(headingVector);
        const perpHeadingVector = vectorFromAngle(this.heading + Math.PI / 2);
        const perpHeadingComponent = this.velocity.dot(perpHeadingVector);

        // Inputs 3-7
        let angles = [Math.PI / 2, Math.PI / 4, 0, -Math.PI / 4, -Math.PI / 2];
        let results = [0, 0, 0, 0, 0];

        // Perform 5 raycasts
        for (let i = 0; i < angles.length; i++) {
            let result = env.raycast(this.position, this.heading + angles[i]);
            results[i] = result;
        }
        
        // Calculate acceleration and turn
        let pred = this.model.predict(tf.tensor2d([headingComponent, perpHeadingComponent, results[0], results[1], results[2], results[3], results[4]], [1, 7])).dataSync();
    
        // Input and update
        this.update(pred[0] * 2 - 1, pred[1] * 2 - 1, delta);
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