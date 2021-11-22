// purpose: represents a 3d circle

import { Const } from "../../math/Const";
import { Matrix4 } from "../../math/Matrix4";
import { Vector3 } from "../../math/Vector3";
import { MultiLine } from "./../mesh/MultiLine";
import { Mesh } from "./../mesh/Mesh";
import { Circle2 } from "./Circle2";
import { Plane } from "./Plane";
import { Geometry } from "../Geometry";

export class Circle3 extends Geometry {

    plane: Plane;
    radius: number;

    private constructor(plane: Plane, radius: number) {
        super();
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
        let center3d = plane.pushToWorld(Vector3.from2d(circle2.center));
        plane = plane.clone();
        plane.center = center3d;
        return new Circle3(plane, circle2.radius);
    }

    ///////////////////////////////////////////////////////////////////////////

    at(t: number) {
        return this.plane.pushToWorld(new Vector3(Math.cos(t) * this.radius, Math.sin(t) * this.radius, 0))
    }

    frameAt(t: number) : Plane {
        let p = this.at(t);
        let ihat = this.plane.center.subbed(p).normalize();
        let jhat = this.plane.khat.normalize();
        return Plane.fromPVV(p, ihat, jhat);
    }

    ///////////////////////////////////////////////////////////////////////////

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

    ///////////////////////////////////////////////////////////////////////////

    clone(): Geometry {
        throw new Error("Method not implemented.");
    }

    transform(m: Matrix4): Geometry {
        throw new Error("Method not implemented.");
    }

    transformed(m: Matrix4): Geometry {
        throw new Error("Method not implemented.");
    }
}
