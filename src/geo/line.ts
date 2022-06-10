import { Domain, Domain2 } from "../math/domain";
import { Vector2 } from "../math/vector";

// heavy weight Line class
export class LineCurve2 {
    readonly from: Vector2;
    readonly to: Vector2;
    readonly vector: Vector2;
    readonly normal: Vector2;
    readonly bounds: Domain;
    readonly length: number;

    constructor(from: Vector2, to: Vector2) {
        this.from = from;
        this.to = to;
        this.vector = to.subbed(this.from);
        this.normal = this.vector.normalized();
        this.bounds = new Domain(0, this.vector.length());
        this.length = this.vector.length();
    }

    at(t: number, bounded = true): Vector2 {
        if (bounded) t = this.bounds.comform(t);
        return Vector2.fromLerp(this.from, this.to, t / this.length);
    }

    atNormal(t: number, bounded = true): Vector2 {
        if (bounded) t = new Domain(0, 1).comform(t);
        return Vector2.fromLerp(this.from, this.to, t);
    }

    closestPoint(point: Vector2, bounded = true): Vector2 | undefined {
        const d = this.vector.length();
        if (d === 0) return;

        let lineToPoint = point.subbed(this.from);
        let dot = lineToPoint.dot(this.vector);
        return this.at(dot, bounded);
    }
}
