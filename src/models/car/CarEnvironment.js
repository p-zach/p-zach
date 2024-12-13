import { Vector2, vectorFromAngle } from "../Vector2";
import { EventEmitter } from 'events'

export const COURSE_IMAGE_WIDTH = 850;
export const COURSE_IMAGE_HEIGHT = 450;

const DEFAULT_RAYCAST_DISTANCE = 800;
const DEFAULT_RAYCAST_SPACING = 3;

export class CarEnvironment extends EventEmitter {
    constructor(courseFileName) {
        super();

        // Create canvas for low-level course image
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d', {willReadFrequently: true});

        this.origin = null;

        // Load course image
        this.courseImage = new Image();
        this.courseImage.onload = () => {
            this.origin = this.findOrigin(this.context);
            this.emit('onFindOrigin');
        };
        this.courseImage.crossOrigin = 'Anonymous';
        this.courseImage.src = courseFileName;
    }

    /**
     * Return the origin of the course by finding the red origin pixel.
     */
    findOrigin(ctx) {
        this.canvas.width = this.courseImage.width;
        this.canvas.height = this.courseImage.height;

        if (this.courseImage.width !== COURSE_IMAGE_WIDTH || this.courseImage.height !== COURSE_IMAGE_HEIGHT)
            throw new Error("Course image size must match defined constants");

        ctx.drawImage(this.courseImage, 0, 0, this.courseImage.width, this.courseImage.height);
        const { data, width } = ctx.getImageData(0, 0, this.courseImage.width, this.courseImage.height);

        for (let i = 0; i < data.length; i += 4) {
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2]; 

            if (red === 255 && green === 0 && blue === 0) {
                const index = i / 4;
                const x = index % width;
                const y = Math.floor(index / width);

                return new Vector2(x, y);
            }
        }
        return Vector2.zero();
    }

    /**
     * Draw the course to the given context.
     */
    drawCourse(context) {
        if (this.courseImage.complete)
        {
            // Draw course
            context.drawImage(this.courseImage, 0, 0, this.courseImage.width, this.courseImage.height);

            if (this.origin != null)
            {
                // Fill in origin pixel
                context.fillStyle = '#000000';
                context.fillRect(this.origin.x, this.origin.y, 1, 1);
            }
        }
    }

    /**
     * Perform a raycast within the course environment.
     * @param {Vector2} origin The origin of the raycast.
     * @param {number} angle The angle of the raycast from the horizontal.
     * @param {number} distance The maximum distance limit of the raycast.
     * @param {number} spacing How many pixels to jump each iteration of the raycast.
     * @returns Distance in pixels to a wall in a direction from origin.
     */
    raycast(origin, angle, distance = DEFAULT_RAYCAST_DISTANCE, spacing = DEFAULT_RAYCAST_SPACING) {
        // Itercasting
        // TODO: Optimize
        let currDist = 0;
        let direction = vectorFromAngle(angle);
        while (currDist < distance) {
            currDist += spacing;
            let curr = origin.add(direction.multiply(currDist));
            if (this.offTrack(curr))
                return currDist;
        }
        return distance;
    }

    /**
     * @param {Vector2} point The point to check.
     * @returns True if the point is off of the track, false otherwise.
     */
    offTrack(point) {
        if (point.x < 0 || point.y < 0 || point.x >= this.canvas.width || point.y >= this.canvas.height)
            return true;
        const pixel = this.context.getImageData(point.x, point.y, 1, 1).data;
        return pixel[0] === 255 && pixel[1] === 255 && pixel[2] === 255;
    }
}