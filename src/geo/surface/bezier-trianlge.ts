import { MultiVector3, Vector3, Matrix4 } from "../../lib";
import { Polynomial } from "../../math/polynomial";
import { Bezier } from "../curve/bezier";
import { BezierSquare } from "./bezier-square";
import { TriSurface } from "./surface";

/**
 * Three sided Bezier Surface
 */
export class BezierTriangle extends TriSurface {
    private _approx: undefined;
    private constructor(public verts: MultiVector3, public readonly degree: number) {
        super();
    }

    static new(verts: MultiVector3, degree: number) {
        return new BezierTriangle(verts, degree);
    }

    /**
     * ```
     * 0----1-----2----3
     * |    |  A  |    |
     * 4----5?----6?---7
     * | B  |     |    | D
     * 8----9?---10?---11
     * |    |     |    |
     * 12---13----14---15
     *         C
     *```
     * @param a
     * @param b
     * @param c
     * @param d
     * @returns
     */
    static fromThreeEdge(a: Bezier, b: Bezier, c: Bezier): BezierTriangle | undefined {
        // TODO do magic to discover the inner control points...
        // TODO bezier curves must be of the same degree
        return undefined;
    }

    pointAt(u: number, v: number, w: number): Vector3 {
        let p = Vector3.zero();

        let count = this.degree + 1;
        for (let i = 0; i < count; i++) {
            for (let j = 0; j < count; j++) {
                let scalar =
                    Polynomial.bernstein(u, i, this.degree) *
                    Polynomial.bernstein(v, j, this.degree);
                let index = i * count + j;
                // console.log(i * count + j, s1, s2, scalar);
                p.add(this.verts.get(index).scaled(scalar));
            }
        }
        return p;
    }

    // geo

    clone(): BezierTriangle {
        return BezierTriangle.new(this.verts.clone(), this.degree)!;
    }

    transform(m: Matrix4): BezierTriangle {
        this._approx = undefined; // invalidate buffered data
        this.verts.transform(m);
        return this;
    }

    transformed(m: Matrix4): BezierTriangle {
        this._approx = undefined; // invalidate buffered data
        return BezierTriangle.new(this.verts.transformed(m), this.degree)!;
    }
}
