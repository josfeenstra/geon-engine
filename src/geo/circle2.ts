import { Const } from "../math/const";
import { Vector2 } from "../math/vector";

export class Circle2 {
    center: Vector2;
    radius: number;

    constructor(center: Vector2, radius: number) {
        this.center = center;
        this.radius = radius;
    }

    // thank you mr Mitteldorf for making me remember how basic math works
    // http://mathforum.org/library/drmath/view/53027.html
    // calculate the centers of two circles, defined by two points and a radius
    static centersFromPPR(a: Vector2, b: Vector2, radius: number): Vector2[] {
        // throw new Error("Method not implemented.");

        // get in between length and halfway point
        let normal = b.clone().sub(a);
        let dis = normal.length();
        let middle = a
            .clone()
            .add(b)
            .scale(1 / 2);

        // scalar length on mirror line (pythagoras)
        let value = radius ** 2 - (dis / 2) ** 2;
        if (value < -Const.TOLERANCE) {
            // no sollution
            return [];
        } else if (value < Const.TOLERANCE) {
            // center roughly in the middle, so just return the middle
            return [middle];
        } else {
            // two circles possible:
            let disToCenter = value ** 0.5;
            let normY = new Vector2(normal.y, -normal.x).normalize();

            // move the middle point up and down
            return [
                middle.clone().add(normY.clone().scale(disToCenter)),
                middle.clone().add(normY.clone().scale(-disToCenter)),
            ];
        }
    }
}
