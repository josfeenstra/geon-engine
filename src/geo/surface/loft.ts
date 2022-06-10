// name:    spline.ts
// author:  Jos Feenstra
// purpose: mathematical representation of a parametric loft surface

import { MultiVector3 } from "../../data/multi-vector-3";
import { Const } from "../../lib";
import { Matrix4 } from "../../math/matrix";
import { Vector3 } from "../../math/vector";
import { Mesh } from "../../mesh/mesh";
import { Bezier } from "../curve/bezier";
import { Curve } from "../curve/curve";
import { Polyline } from "../curve/polyline";
import { Geo } from "../geo";
import { BiSurface } from "./surface";

export class Loft extends BiSurface {
    private constructor(public curves: Bezier[]) {
        super();
    }

    static new(curves: Bezier[]) {
        // make sure all curves are of the same degree, so we can easely interpolate
        return new Loft(Bezier.equalizeDegrees(curves));
    }

    getTransposedCurves(): Bezier[] {
        // this can only happen if the curves are all of the same degree,
        // and at the very least, have the same number of controlpoints
        let curves = [];
        let isize = this.curves[0].verts.count;
        let jsize = this.curves.length;
        for (let i = 0; i < isize; i++) {
            let verts = MultiVector3.new(this.curves.length);
            for (let j = 0; j < jsize; j++) {
                verts.set(j, this.curves[j].verts.get(i));
            }
            curves.push(Bezier.new(verts));
        }
        return curves;
    }

    pointAt(u: number, v: number): Vector3 {
        return this.isoCurveV(u).pointAt(v);
    }

    isoCurveV(u: number): Bezier {
        return Loft.isoCurve(this.curves, u);
    }

    isoCurveU(v: number): Bezier {
        let trans = this.getTransposedCurves();
        return Loft.isoCurve(trans, v);
    }

    private static isoCurve(curves: Bezier[], t: number) {
        let pts = MultiVector3.new(curves.length);
        for (let i = 0; i < curves.length; i++) {
            pts.set(i, curves[i].pointAt(t));
        }
        return Bezier.new(pts);
    }

    /**
     * same as buffer, but the udetail is semi-automated
     */
    bufferExact() {
        // NOTE : to make this always watertight: take note of the precision when using polylines:
        let vals: number[] = [];
        for (let c of this.curves) {
            if (c instanceof Polyline) {
                vals.push(c.verts.count - 1);
            }
        }

        let perfectuSegments = vals.reduce((a, b) => {
            return a * b;
        });

        return Mesh.fromBiSurface(this, perfectuSegments, perfectuSegments);
    }

    clone(): Loft {
        let curves = new Array<Bezier>();
        for (let i = 0; i < this.curves.length; i++) {
            curves[i] = this.curves[i].clone();
        }
        return Loft.new(curves);
    }

    transform(m: Matrix4): Loft {
        for (let c of this.curves) {
            c.transform(m);
        }
        return this;
    }

    transformed(m: Matrix4): Loft {
        let curves = new Array<Bezier>();
        for (let i = 0; i < this.curves.length; i++) {
            curves[i] = this.curves[i].transformed(m);
        }
        return Loft.new(curves);
    }
}


