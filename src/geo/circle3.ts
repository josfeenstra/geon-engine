// purpose: represents a 3d circle

import { Const } from "../math/const";
import { Matrix4 } from "../math/matrix";
import { Vector3 } from "../math/vector";
import { MultiLine } from "../mesh/multi-line";
import { Mesh } from "../mesh/mesh";
import { Circle2 } from "./circle2";
import { Plane } from "./plane";

export class Circle3 {
    plane: Plane;
    radius: number;

    private constructor(plane: Plane, radius: number) {
        this.plane = plane;
        this.radius = radius;
    }

    static new(plane: Plane, radius: number) {
        return new Circle3(plane, radius);
    }

    static newPlanar(point: Vector3, radius: number) {
        return new Circle3(Plane.WorldXY().moveTo(point), radius);
    }

    static fromCircle2(circle2: Circle2, plane = Plane.WorldXY()) {
        // elevate center of circle, make it the center of a plane
        let center3d = plane.pushToWorld(circle2.center.to3D());
        plane = plane.clone();
        plane.center = center3d;
        return new Circle3(plane, circle2.radius);
    }

    // convert
    buffer(): MultiLine {
        return MultiLine.fromCircle(this);
    }

    includes(p: Vector3): boolean {
        // test if the point falls in range of the circle, by regarding
        // the circle as a torus

        // CHANGE NOTE: i set this to zero, for testing
        // vertical error
        let [projPoint, yError] = this.plane.closestPoint(p);
        yError = yError / 3;

        // horizontal error: get the difference between point
        let xError = this.plane.center.clone().disTo(projPoint) - this.radius;

        // length of total error vector needs to be smaller than the given
        // tolerance
        return yError ** 2 + xError ** 2 < Const.TOL_SQUARED;
    }
}
