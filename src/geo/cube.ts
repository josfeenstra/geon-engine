// name:    cube.ts
// author:  Jos Feenstra
// purpose: Represents a cube in 3d space, in a certain pose.

import { Domain3, Plane, Vector3 } from "../lib";

export class Cube {
    constructor(public plane: Plane, public domain: Domain3) {}

    static new(plane: Plane, domain: Domain3) {
        return new Cube(plane, domain);
    }

    static fromRadius(point: Vector3, radius: number): Cube {
        return new Cube(Plane.WorldXY().moveTo(point), Domain3.fromRadius(radius));
    }

    getCorners(): Vector3[] {
        return this.domain.corners(this.plane.matrix);
    }
}
