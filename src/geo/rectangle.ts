import { Domain2 } from "../math/domain";
import { Matrix3, Matrix4 } from "../math/matrix";
import { Vector2 } from "../math/vector";

// basic 2d rectangle
// a Matrix3 and Domain2 is used.
// this way, a rectangle can be rotated around an arbirtary point it regards as its center.
// name:    cube.ts
// author:  Jos Feenstra
// purpose: Represents a cube in 3d space, in a certain pose.

import { Vector3 } from "../math/vector";
import { Geo } from "./geo";
import { Plane } from "./plane";

export class Rectangle2 {
    pose: Matrix3;
    domain: Domain2;

    constructor(pose: Matrix3, domain: Domain2) {
        this.pose = pose;
        this.domain = domain;
    }

    static new(startX: number, startY: number, width: number, height: number) {
        let pose = Matrix3.newTranslation(startX, startY);
        let domain = Domain2.fromBounds(0,0,width, height);
    }

    center(): Vector2 {
        return this.pose.transformVector(new Vector2(0, 0));
    }

    getVertices(): Vector2[] {
        let verts = [
            new Vector2(this.domain.x.t0, this.domain.y.t0),
            new Vector2(this.domain.x.t1, this.domain.y.t0),
            new Vector2(this.domain.x.t0, this.domain.y.t1),
            new Vector2(this.domain.x.t1, this.domain.y.t1),
        ];

        verts.forEach((v) => this.pose.transformVector(v));
        return verts;
    }

    to3D(): Rectangle3 {
        let mat4 = this.pose.toMat4();
        return new Rectangle3(new Plane(mat4), this.domain);
    }
}

export class Rectangle3 {
    plane: Plane;
    domain: Domain2;

    constructor(plane: Plane, domain: Domain2) {
        this.plane = plane;
        this.domain = domain;
    }

    static new(plane: Plane, domain: Domain2) {
        return new Rectangle3(plane, domain);
    }

    getCorners(): Vector3[] {
        let corners = this.domain.corners();
        let corners3 = corners.map((c) => this.plane.pushToWorld(c.to3D()));
        return corners3;
    }
}
