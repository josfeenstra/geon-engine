import { Vector2, MultiVector2, Vector3, Plane, LineCurve2 } from "../lib";

export class Triangle2 {
    a: Vector2;
    b: Vector2;
    c: Vector2;

    constructor(a: Vector2, b: Vector2, c: Vector2) {
        this.a = a;
        this.b = b;
        this.c = c;
    }

    points(): MultiVector2 {
        return MultiVector2.fromList([this.a, this.b, this.c]);
    }

    toBarycentric(point: Vector2): Vector3 {
        let v0 = this.b.subbed(this.a);
        let v1 = this.c.subbed(this.a);
        let v2 = point.subbed(this.a);
        let d00 = v0.dot(v0);
        let d01 = v0.dot(v1);
        let d11 = v1.dot(v1);
        let d20 = v2.dot(v0);
        let d21 = v2.dot(v1);
        let denom = d00 * d11 - d01 * d01;
        let v = (d11 * d20 - d01 * d21) / denom;
        let w = (d00 * d21 - d01 * d20) / denom;
        let u = 1.0 - v - w;

        return new Vector3(u, v, w);
    }

    fromBarycentric(bari: Vector3): Vector2 {
        let a = this.a.scaled(bari.x);
        let b = this.b.scaled(bari.y);
        let c = this.c.scaled(bari.z);

        return a.add(b).add(c);
    }

    closestPoint(point: Vector2): Vector2 {
        // figure out roughly where the point is.
        // note:
        let ab = point.sign(this.a, this.b);
        let bc = point.sign(this.b, this.c);
        let ca = point.sign(this.c, this.a);

        // if its fully within, return it!
        if ((ab < 0 && bc < 0 && ca < 0) || (ab > 0 && bc > 0 && ca > 0)) {
            console.log("fully inside!");
            return point;
        } else {
            let abs = Math.abs(ab);
            let bcs = Math.abs(bc);
            let cas = Math.abs(ca);

            if (abs < bcs && abs < cas) {
                // ab
                return new LineCurve2(this.a, this.b).closestPoint(point)!;
            } else if (bcs < cas) {
                // bc
                return new LineCurve2(this.b, this.c).closestPoint(point)!;
            } else {
                // ca
                return new LineCurve2(this.c, this.a).closestPoint(point)!;
            }
        }
    }
}

export class Triangle3 {
    a: Vector3;
    b: Vector3;
    c: Vector3;

    constructor(a: Vector3, b: Vector3, c: Vector3) {
        this.a = a;
        this.b = b;
        this.c = c;
    }

    points(): Vector3[] {
        return [this.a, this.b, this.c];
    }

    getPlane(): Plane {
        return Plane.from3pt(this.a, this.b, this.c);
    }

    to2D(plane: Plane = Plane.WorldXY()): Triangle2 {
        return new Triangle2(
            plane.pullToPlane(this.a).to2D(),
            plane.pullToPlane(this.b).to2D(),
            plane.pullToPlane(this.c).to2D(),
        );
    }

    closestPoint(point: Vector3): Vector3 {
        let plane = this.getPlane();
        let [cp, _] = plane.closestPoint(point);
        let planeCP = plane.pullToPlane(cp);
        let planeTriangle = this.to2D(plane);

        return point;
    }

    // Transcribed from Christer Ericson's Real-Time Collision Detection:
    // http://realtimecollisiondetection.net/
    toBarycentric(point: Vector3): Vector3 {
        let v0 = this.b.subbed(this.a);
        let v1 = this.c.subbed(this.a);
        let v2 = point.subbed(this.a);
        let d00 = v0.dot(v0);
        let d01 = v0.dot(v1);
        let d11 = v1.dot(v1);
        let d20 = v2.dot(v0);
        let d21 = v2.dot(v1);
        let denom = d00 * d11 - d01 * d01;
        let v = (d11 * d20 - d01 * d21) / denom;
        let w = (d00 * d21 - d01 * d20) / denom;
        let u = 1.0 - v - w;

        return new Vector3(u, v, w);
    }

    fromBarycentric(bari: Vector3): Vector3 {
        let a = this.a.clone().scale(bari.x);
        let b = this.b.clone().scale(bari.y);
        let c = this.c.clone().scale(bari.z);

        return a.added(b).add(c);
    }
}
