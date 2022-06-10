// name:    geo.ts
// author:  Jos Feenstra
// purpose: base class of all 3d geometry
// note:    TODO

import { Matrix4 } from "../math/matrix";
import { Vector3 } from "../math/vector";

// i want traits....
export abstract class Geo {
    abstract clone(): Geo;

    abstract transform(m: Matrix4): Geo;

    abstract transformed(m: Matrix4): Geo;

    rotateX(radians: number) {
        let rotater = Matrix4.newXRotation(radians);
        return this.transform(rotater);
    }

    rotateY(radians: number) {
        let rotater = Matrix4.newYRotation(radians);
        return this.transform(rotater);
    }

    rotateZ(radians: number) {
        let rotater = Matrix4.newZRotation(radians);
        return this.transform(rotater);
    }

    rotate(radians: number, axis: Vector3) {
        let rotater = Matrix4.newAxisRotation(axis, radians);
        return this.transform(rotater);
    }

    move(m: Vector3) {
        let mover = Matrix4.newTranslate(m);
        return this.transform(mover);
    }

    scale(s: Vector3) {
        let scaler = Matrix4.newScaler(s.x, s.y, s.z);
        return this.transform(scaler);
    }

    // all past-tense functions return a copied object, just like the vectors

    rotatedX(radians: number) {
        let rotater = Matrix4.newXRotation(radians);
        return this.transformed(rotater);
    }

    rotatedY(radians: number) {
        let rotater = Matrix4.newYRotation(radians);
        return this.transformed(rotater);
    }

    rotatedZ(radians: number) {
        let rotater = Matrix4.newZRotation(radians);
        return this.transformed(rotater);
    }

    rotated(radians: number, axis: Vector3) {
        let rotater = Matrix4.newAxisRotation(axis, radians);
        return this.transformed(rotater);
    }

    moved(m: Vector3) {
        let mover = Matrix4.newTranslate(m);
        return this.transformed(mover);
    }

    scaled(s: Vector3) {
        let scaler = Matrix4.newScaler(s.x, s.y, s.z);
        return this.transformed(scaler);
    }
}
