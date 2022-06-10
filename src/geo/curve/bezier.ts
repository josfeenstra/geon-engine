// name:    bezier.ts
// author:  Jos Feenstra
// purpose: mathematical representation of a simple parametric curve
// notes:   based upon the excellent explainations from Prof. C.-K. Shene: https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/

import { MultiVector3 } from "../../data/multi-vector-3";
import { Domain, Domain2 } from "../../lib";
import { Const } from "../../math/const";
import { GeonMath } from "../../math/math";
import { Matrix4 } from "../../math/matrix";
import { Polynomial } from "../../math/polynomial";
import { Random } from "../../math/random";
import { Util } from "../../math/util";
import { Vector2, Vector3 } from "../../math/vector";
import { MultiLine } from "../../mesh/multi-line";
import { Stopwatch } from "../../system/stopwatch";
import { Curve } from "./curve";
import { Polyline } from "./polyline";

export class Bezier extends Curve {
    private _approx?: Polyline;

    public constructor(verts: MultiVector3, degree: number) {
        super(verts, degree);
    }

    static fromList(verts: Vector3[]) {
        return this.new(MultiVector3.fromList(verts));
    }

    static new(verts: MultiVector3) {
        return new Bezier(verts, verts.count - 1);
    }

    static equalizeDegrees(curves: Bezier[]): Bezier[] {
        // get highest degree
        let maxDegree = 0;
        for (let curve of curves) {
            if (curve.degree > maxDegree) {
                maxDegree = curve.degree;
            }
        }
    
        // elevate each curve to that degree
        for (let i = 0; i < curves.length; i++) {
            let failsave = 0;
    
            while (curves[i].degree < maxDegree && failsave < 100) {
                curves[i] = curves[i].increaseDegree();
                failsave++;
            }
        }
    
        return curves;
    }



    /**
     * Calculate the so-called hodograph of this curve, which is a curve representing all its tangents
     */
    hodograph(): Bezier {
        let hodoVerts = MultiVector3.new(this.verts.count - 1);
        for (let i = 0; i < this.verts.count - 1; i++) {
            hodoVerts.set(i, this.verts.get(i + 1).subbed(this.verts.get(i)));
        }
        return Bezier.new(hodoVerts);
    }

    /**
     * Return a new curve which is a copy of this curve, but with one added control point
     * Do this recursively, and you have something like decastejau's
     * However, this process cannot be rewritten as a polynomial, since the i / (n + 1) ratio changes every iteration
     */
    increaseDegree(): Bezier {
        // if (degree <= this.degree) {
        //     console.warn("same or lower degree than my current degree...");
        //     return this.clone();
        // }

        // increase degree by one.
        let n = this.degree;
        let verts = MultiVector3.new(n + 2);

        // copy first and last
        verts.set(0, this.verts.get(0));
        verts.set(verts.count - 1, this.verts.get(this.verts.count - 1));

        // interpolate in-betweens
        for (let i = 1; i < n + 1; i++) {
            let pa = this.verts.get(i - 1);
            let pb = this.verts.get(i);
            let sa = i / (n + 1);
            let sb = 1 - sa;
            let q = pa.scale(sa).add(pb.scale(sb));
            verts.set(i, q);
        }

        // create a new curve from it
        return Bezier.new(verts);
    }

    /**
     * subdivide into to new bezier curves,
     * with the same number of control points
     */
    splitAt(t: number): [Bezier, Bezier] {
        // get triangle
        let size = this.degree + 1;
        let tri = Polynomial.decastejau(this.verts, t);

        // prepare
        let left = Util.getTriangleLeft(tri, size);
        let right = Util.getTriangleRight(tri, size);

        return [Bezier.new(left), Bezier.new(right)];
    }

    /**
     * Extends the curve
     * 
     * ```js
     * (part1, part2) = whole.split(0.5)
     * assert_eq!(part1.extend(1) == whole)
     * ```
     */
    extend(extra: number) {
        // get the decastejau piramid based on extrapolation instead of interpolation
        let piramid = Polynomial.decastejauExtrapolateEnd(this.verts, extra);

        // the base of the piramid is the whole
        let size = this.verts.count
        let base = Util.getTriangleBase(piramid, size);
        this.verts = base;
    }

    getExtention(extra: number) : Bezier {
        // get the decastejau piramid based on extrapolation instead of interpolation
        let piramid = Polynomial.decastejauExtrapolateEnd(this.verts, extra);

        // the base of the piramid is the whole
        let size = this.verts.count
        let right = Util.getTriangleRight(piramid, size);
        return Bezier.new(right);
    }

    /**
     *
     */
    pointAt(t: number): Vector3 {
        let p = Vector3.zero();
        for (let i = 0; i < this.degree + 1; i++) {
            p.add(this.verts.get(i).scaled(Polynomial.bernstein(t, i, this.degree)));
        }
        return p;
    }

    /**
     * Calculate the tangent at parameter t.
     * Tangent is calculated using a method described here: https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/Bezier/bezier-der.html
     * Note that is is not the fasted thing ever. Use the hodograph to eval a huge range of tangents if you desire that
     */
    tangentAt(t: number): Vector3 {
        // evaluate the so-called 'hodograph' of this curve
        return this.hodograph().pointAt(t).normalize();
    }

    /**
     * Calculate the normal at parameter t
     */
    normalAt(t: number, up = Vector3.unitZ()): Vector3 {
        return this.tangentAt(t).cross(up);
    }

    /**
     * Approximate the closest point with a wacky method
     * partially taken from: https://stackoverflow.com/questions/2742610/closest-point-on-a-cubic-bezier-curve
     * 
     * @param p 
     * @param precision 2 is very low res, 10 is maybe overkill 
     * @param tolerance 
     * @returns 
     */
    ApproxClosestPoint(p: Vector3, precision=5, tolerance = Const.TOLERANCE) {

        let disToParam = (t: number) => p.disToSquared(this.pointAt(t));

        // NOTE: 
        // we can get away with this, because bezier curves are guaranteed
        // to not 'spike' like any higher order polynomial might
        let scans = precision * this.verts.count;
        let lowest_value = Infinity;
        let best_t = -1;
        
        for (let i = 1 ; i < scans + 1; i++) {
            let t = i / scans;
            let value = disToParam(t)
            if (value < lowest_value) {
                lowest_value = value;
                best_t = i
            }
        }

        // now, binary-search the smallest value
        let t0 = Math.max((best_t-1)/scans, 0);
        let t1 = Math.min((best_t+1)/scans, 1);
        let domain = Domain.new(t0, t1);
        let t = Util.lowestScore(domain, disToParam, tolerance);

        return t
    }

    /**
     * NOTE: work in progress, I am trying a different method
     */
    private uglyClosestPoint(p: Vector3, precision = 4) : [Vector3, number] {
        
        // STEP 1 : get a number of suspect closest points.
        let suspects: Vector3[] = [];
        let ts: number[] = [];
        let addSuspect = (t: number) => {
            suspects.push(this.pointAt(t));
            ts.push(t);
        }

        // start and end are always suspect
        addSuspect(this.domain.t0);
        addSuspect(this.domain.t1);

        // suspects are point 'v' whose tangents are 90 degrees towards the vector 'pv' 
        // in other words 

        // STEP 2 : get the actual closest suspect using pythagoras
        let distance = Infinity;
        let bestIdx = -1;

        for (let i = 0 ; i < suspects.length; i++) {
            let dis = p.disToSquared(suspects[i]);
            if (dis < distance) {
                distance = dis;
                bestIdx = i
            }
        }
        
        return [suspects[bestIdx], ts[bestIdx]];
    }


    /**
     * Note: All methods dealing with length are approximate
     */
    pointAtApproxLength(length: number) {
        this.toPolyline(100).tAtLength(length);
    }

    getLazyApprox() {
        if (!this._approx) {
            this.bufferApprox();
        }
        return this._approx!;
    }

    bufferApprox() {
        this._approx = this.toPolyline(100);
    }

    // geo trait

    clone(): Bezier {
        return Bezier.new(this.verts.clone());
    }

    transform(m: Matrix4): Bezier {
        this._approx = undefined; // invalidate buffered data
        this.verts.transform(m);
        return this;
    }

    transformed(m: Matrix4): Bezier {
        this._approx = undefined; // invalidate buffered data
        return Bezier.new(this.verts.transformed(m));
    }
}

// Shorthand for Cubic Bezier
export class Cubez extends Bezier {
    private constructor(verts: MultiVector3) {
        super(verts, 3);
    }

    static new(verts: MultiVector3) {
        return new Cubez(verts);
    }
}





function test(times=1000) {
    
    let sw = Stopwatch.new();
    let bezier = Bezier.fromList([
        Vector3.new(-2, -2, 0),
        Vector3.new(-2, 2, 0),
        Vector3.new(2, 2, 0),
        Vector3.new(2, -2, 0),
    ]);

    let rng = Random.fromRandom();
    let domain = Domain2.fromRadii(2,2);

    for (let i = 0; i < times; i++) {
        let randomVec = domain.elevate(Vector2.fromRandom(rng)).to3D();
        bezier.ApproxClosestPoint(randomVec);
    }
    sw.log(`${times}x closest point`);
    // 10000x closest point took: 144ms 
    // closest point takes approx. 0.0144ms on my machine
}