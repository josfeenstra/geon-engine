// purpose: polynomial math needed for curves & surfaces
// note: uses a hardcoded pascal's triangle for performance reasons
// notes:   based upon the excellent explainations from Prof. C.-K. Shene: https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/

import { MultiVector3 } from "../data/multi-vector-3";
import { Const } from "./const";
import { GeonMath } from "./math";
import { Util } from "./util";
import { Vector3 } from "./vector";

export class Polynomial {
    // pascals's triangle. Hardcoded for performance

    static MAX_DEGREE = 15;
    static _pascal = Polynomial.calcPascal(Polynomial.MAX_DEGREE);

    /**
     *   calculate weight using the Bernstein Polynomials:
     *   (n over i) t^i * (1-t)^(n - i).
     *   precalculated Pascal's triangle for a bit more efficiency
     * @param t parameter t
     * @param i vert index
     * @param n degree
     * @returns
     */
    static bernstein(t: number, i: number, n: number): number {
        return this.getBicoef(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
    }

    /**
     * CoxDeboor's recusion formula.
     * Basicly bernstein, but for b-splines
     * NOTE: inefficient calculation: recursive in the dumb sense
     */
    static coxdeboor(t: number, i: number, degree: number, knots: Float32Array): number {
        // console.log("t", t, "i", i, "degree", degree);

        // let ui = knots[i];
        // let ui1 = knots[i+1];
        // let uip = knots[i+degree];
        // let uip1 = knots[i + degree + 1];

        if (degree == 0) {
            // console.log("range", knots[i], " to ", knots[i + 1]);
            if (t >= knots[i] && t < knots[i + 1]) {
                // console.log("in between!");
                return 1;
            }
            return 0;
        }
        let denom1 = knots[i + degree] - knots[i];
        let denom2 = knots[i + degree + 1] - knots[i + 1];
        // if (denom1 == 0 || denom2 == 0) {
        //     console.log("zero");
        //     return 0;
        // }
        let c1 = (t - knots[i]) / denom1;
        let c2 = (knots[i + degree + 1] - t) / denom2;

        // console.log(c1);
        // console.log(c2);
        return (
            c1 * this.coxdeboor(t, i, degree - 1, knots) +
            c2 * this.coxdeboor(t, i + 1, degree - 1, knots)
        );
    }

    /**
     * CoxDeboor's recusion formula.
     * Basicly bernstein, but for b-splines
     * NOTE: this is but a sketch, this is not correct yet...
     * NOTE: the result will be
     */
    static coxdeboorTriangle(t: number, i: number, p: number, knots: Float32Array): Float32Array {
        let size = knots.length;
        // console.log(points.count);

        // create the triangle of resulting points
        let result = new Float32Array(GeonMath.stack(size));

        // triangle iteration is complex :)
        let tri = Util.iterateTriangle;

        // copy paste the base
        let basecolumn = size - 1;
        let j = 0;
        for (let row = 0; row <= basecolumn; row++) {
            let idx = tri(basecolumn, row);
            if (knots[i] <= t || t < knots[i + 1]) {
                result[idx] = 1;
            }
            result[idx] = 0;
            j++;
        }

        // iterate over this triangle, starting at the base + 1
        for (let col = size - 2; col > -1; col -= 1) {
            for (let row = 0; row <= col; row++) {
                let idx = tri(col, row);
                let left = result[tri(col + 1, row)];
                let right = result[tri(col + 1, row + 1)];

                let c1 = (t - knots[i]) / (knots[i + p] - knots[i]);
                let c2 = (knots[i + p + 1] - t) / (knots[i + p + 1] - knots[i + 1]);
                result[idx] = c1 * left + c2 * right;
            }
        }

        return result;
    }

    /**
     * Binomial coeficient
     */
    static getBicoef(n: number, i: number) {
        return this._pascal[n][i];
    }

    /**
     * Binomial coeficient
     */
    static calcBicoef(n: number, i: number) {
        let f = GeonMath.factorial;
        return f(n) / (f(i) * f(n - i));
    }

    static calcPascal(limit: number) {
        let pascal: number[][] = Array<Array<number>>(limit);

        for (let n = 0; n < limit; n++) {
            pascal[n] = Array<number>(n + 1);
            for (let i = 0; i < n + 1; i++) {
                pascal[n][i] = this.calcBicoef(n, i);
            }
        }
        return pascal;
    }

    /**
     *  This function returns the entire castejau piramid.
     *  the final point is the first: verts[0].
     *  Hovever, this is slower than the PointAt() method,
     *  which uses bernstein polynomials
     *
     *  useful for:
     *  Subdividing bezier curves, debugging, and splines
     */
    static decastejau(verts: MultiVector3, t: number) {
        let size = verts.count;
        // console.log(points.count);

        // create the triangle of resulting points
        let result = MultiVector3.new(GeonMath.stack(size));

        // triangle iteration is complex :)
        let tri = Util.iterateTriangle;

        // copy paste the base
        let basecolumn = size - 1;
        let i = 0;
        for (let row = 0; row <= basecolumn; row++) {
            let idx = tri(basecolumn, row);
            result.set(idx, verts.get(i));
            i++;
        }

        // iterate over this triangle, starting at the base + 1
        for (let col = size - 2; col > -1; col -= 1) {
            for (let row = 0; row <= col; row++) {
                let idx = tri(col, row);
                let p_a = result.get(tri(col + 1, row));
                let p_b = result.get(tri(col + 1, row + 1));
                let q = p_b.scale(t).add(p_a.scale(1 - t));
                result.set(idx, q);
            }
        }

        return result;
    }

    // calculate the decastejau piramid based on extrapolation
    static decastejauExtrapolateEnd(verts: MultiVector3, t: number) {
        
        let size = verts.count;

        // create the triangle of resulting points
        let triangle = MultiVector3.new(GeonMath.stack(size));

        // triangle iteration is complex :)
        let iterTri = Util.iterateTriangle;

        let i = 0;
        for (let col = size - 1; col > -1; col -= 1) {
            let idx = iterTri(col, 0)
            triangle.set(idx, verts.get(i));
            i++
        }

        // per triangle of 3 within this triangle (hard to put into words...)
        for (let col = 1; col < size; col++) {
            for (let row = 1; row <= col; row++) {
                let a = iterTri(col-1, row-1);
                let b = iterTri(col, row-1);
                let c = iterTri(col, row);

                // set C based upon extrapolation of B past A
                let C = triangle.get(b).lerp(triangle.get(a), 1 + t);
                triangle.set(c, C);
            }
        }
        // triangle.map(v => console.log(v));
        return triangle;
    }

    static decastejauExtrapolateStart(verts: MultiVector3, t: number) {
        let size = verts.count;
        // console.log(points.count);

        // create the triangle of resulting points
        let result = MultiVector3.new(GeonMath.stack(size));

        // triangle iteration is complex :)
        let tri = Util.iterateTriangle;

        // copy paste the base
        let basecolumn = size - 1;
        let i = 0;
        for (let row = 0; row <= basecolumn; row++) {
            let idx = tri(basecolumn, row);
            result.set(idx, verts.get(i));
            i++;
        }

        // iterate over this triangle, starting at the base + 1
        for (let col = size - 2; col > -1; col -= 1) {
            for (let row = 0; row <= col; row++) {
                let idx = tri(col, row);
                let p_a = result.get(tri(col + 1, row));
                let p_b = result.get(tri(col + 1, row + 1));
                let q = p_b.scale(t).add(p_a.scale(1 - t));
                result.set(idx, q);
            }
        }

        return result;
    }
}
