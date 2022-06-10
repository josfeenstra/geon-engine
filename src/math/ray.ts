// author:  Jos Feenstra
// purpose: infinite Ray used for projection and similar actions
// notes:   found some nice examples at https://www.cs.princeton.edu/courses/archive/fall00/cs426/lectures/raycast/sld004.htm

import { MultiLine } from "../mesh/multi-line";
import { Plane } from "../geo/plane";
import { Vector3 } from "./vector";

export class Ray {
    origin: Vector3;
    normal: Vector3;

    // i do this to force intent : from points, or from normal. Both vector3, so otherwise confusing
    private constructor(origin: Vector3, normal: Vector3) {
        this.origin = origin;
        this.normal = normal.normalize();
    }

    static fromNormal(origin: Vector3, normal: Vector3): Ray {
        return new Ray(origin, normal);
    }

    static fromPoints(origin: Vector3, through: Vector3): Ray {
        return new Ray(origin, through.subbed(origin).normalize());
    }

    at(t: number): Vector3 {
        return this.origin.added(this.normal.scaled(t));
    }

    xPlane(plane: Plane): number {
        // ray : pt = rOrigin + t * rNormal
        // plane : a, b, c, d -> pNormal(a, b, c) , d
        // plane : P . N + d = 0;
        // substitute for p:
        // t = -(rOrigin . N + d) / (V . N)

        let ray = this; // to be clear
        return -(ray.origin.dot(plane.normal) + plane.d) / ray.normal.dot(plane.normal);
    }

    toLine(length: number): MultiLine {
        let toPoint = this.at(length);
        return MultiLine.fromLines([this.origin, toPoint]);
    }
}
