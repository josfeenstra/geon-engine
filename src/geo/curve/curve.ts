// name:    spline.ts
// author:  Jos Feenstra
// purpose: base class for all parametric curves:
// - Bezier
// - Spline
// - Polyline (not terminologically correct but in terms of logic it makes sense)

import { MultiVector3 } from "../../data/multi-vector-3";
import { Matrix4 } from "../../math/matrix";
import { Vector3 } from "../../math/vector";
import { MultiLine } from "../../mesh/multi-line";
import { Geo } from "../geo";

// domain is always normalzed, from 0 to 1
export abstract class Curve extends Geo {
    constructor(public verts: MultiVector3, public readonly degree: number) {
        super();
    }

    abstract pointAt(t: number): Vector3;

    abstract buffer(numSegments: number): MultiLine;

    abstract clone(): Curve;

    abstract transform(m: Matrix4): Curve;

    abstract transformed(m: Matrix4): Curve;

    // deal with 'length'

    // protected length
    // protected lengthMap!: number[];
    // protected mustRecalculate = true;

    // protected recalculateLength() {}

    // public getLength() {
    //     if (mustRecalculate) {
    //         this.recalculateLength();
    //     }

    // }
}
