// todo : research tensor: https://en.wikipedia.org/wiki/Tensor_product

import { MultiVector3 } from "../../data/multi-vector-3";
import { Const, Util } from "../../lib";
import { Domain, Domain2 } from "../../math/domain";
import { Matrix4 } from "../../math/matrix";
import { Polynomial } from "../../math/polynomial";
import { Random } from "../../math/random";
import { Vector2, Vector3 } from "../../math/vector";
import { Stopwatch } from "../../system/stopwatch";
import { Bezier } from "../curve/bezier";
import { Geo } from "../geo";
import { BiSurface, TriSurface } from "./surface";

/**
 * Four sided Bezier Surface
 */
export class BezierSquare extends BiSurface {
    private _approx: undefined;
    private constructor(public verts: MultiVector3, public readonly degreeU: number, public readonly degreeV: number) {
        super();
    }

    static new(verts: MultiVector3, degreeU: number, degreeV: number) {
        // let degree = Math.sqrt(verts.count);
        if (verts.count != (degreeU+1) * (degreeV+1)) {
            console.warn(
                `BiSurface Not Created. ${verts.count} vertices 
                does not match ${degreeU} degreeU times ${degreeV} degreeV surface...`,
            );
            return undefined;
        }
        return new BezierSquare(verts, degreeU, degreeV);
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
    static fromFourEdge(a: Bezier, b: Bezier, c: Bezier, d: Bezier): BezierSquare | undefined {
        // TODO do magic to discover the inner control points...
        // NOTE: the magic is just a tensor product of control points : https://en.wikipedia.org/wiki/Tensor_product
        
        // TODO bezier curves must be of the same degree

        return undefined;
    }

    static fromLoft(curves: Bezier[]) {

        curves = Bezier.equalizeDegrees(curves);
        let degreeV = curves[0].degree;
        let degreeU = curves.length-1;

        let count = degreeV + 1 * curves.length;
        let verts = MultiVector3.new(count);
        let idx = 0;
        for (let i = 0 ; i < curves.length; i++) {
            for (let j = 0 ; j < curves[i].verts.count; j++) {
                verts.set(idx, curves[i].verts.get(j));
                idx++;
            }
        }
        return BezierSquare.new(verts, degreeU, degreeV);
    }

    /////////// properties ///////////

    pointAt(u: number, v: number): Vector3 {
        let p = Vector3.zero();

        for (let i = 0; i <  this.degreeU + 1; i++) {
            for (let j = 0; j <  this.degreeV + 1; j++) {
                let scalar =
                    Polynomial.bernstein(u, i, this.degreeU) *
                    Polynomial.bernstein(v, j, this.degreeV);
                let index = i * (this.degreeV + 1) + j;
                // console.log(i * count + j, s1, s2, scalar);
                p.add(this.verts.get(index).scaled(scalar));
            }
        }

        return p;
    }

    pointAtUV(uv: Vector2): Vector3 {
        return this.pointAt(uv.x, uv.y);
    }

    //////////////// projection /////////////////

    /**
     * NOTE: this is tested hastely, use with care
     * @param p 
     * @param precision 2 is low-res, 10 is high-res, but more expensive. 
     * @param tolerance 
     * @returns 
     */
    approxClosestPoint(p: Vector3, precision=2,tolerance = Const.TOLERANCE): Vector2 {

        let disToParams = (u: number, v: number) => p.disToSquared(this.pointAt(u, v));

        let scansU = precision * (this.degreeU + 1);
        let scansV = precision * (this.degreeV + 1);
        let lowest_value = Infinity;
        let best_i = -1;
        let best_j = -1;
        
        for (let i = 1 ; i < scansU + 1; i++) {
            let u = i / scansU;
            for (let j = 1 ; j < scansU + 1; j++) {
                let v = j / scansV;
                let value = disToParams(u,v);
                if (value < lowest_value) {
                    lowest_value = value;
                    best_i = i;
                    best_j = j;
                }
            }
        }

        // now, binary-search the smallest value in a patch around the best guess
        let domain = Domain2.fromBounds(
            Math.max((best_i-1)/scansU, 0),
            Math.min((best_i+1)/scansU, 1),
            Math.max((best_j-1)/scansV, 0),
            Math.min((best_j+1)/scansV, 1),
        )

        let uv = Util.lowestScoreSquared(domain, disToParams, tolerance);

        return uv;
    }

    /////////////////////////// geo //////////////////////////

    clone(): BezierSquare {
        return BezierSquare.new(this.verts.clone(), this.degreeU, this.degreeV)!;
    }

    transform(m: Matrix4): BezierSquare {
        this._approx = undefined; // invalidate buffered data
        this.verts.transform(m);
        return this;
    }

    transformed(m: Matrix4): BezierSquare {
        this._approx = undefined; // invalidate buffered data
        return BezierSquare.new(this.verts.transformed(m), this.degreeU, this.degreeV)!;
    }
}


function test(times=1000) {
    
    // get some points
    let sw = Stopwatch.new();
    let rng = Random.fromSeed(1234);
    let degree = 2;
    let displace = 5;
    let vecs = Domain2.fromRadius(-11) // span a (-size to size)**2 domain
        .offset([-22, 22, 0, 0]) // flip it
        .spawn(degree + 1, degree + 1) // spawn a bunch of points, the exact amound needed for the surface
        .to3D()
        .forEach((v) => {
            return v
                .add(Vector3.fromRandomUnit(rng).scale(displace))
                .add(Vector3.unitZ().scale(5)); // and displace them slightly
        });

    // create a surface from it
    let s = BezierSquare.new(vecs, degree, degree)!;
    let domain = Domain2.fromRadii(11,11);

    sw.log("creation");

    for (let i = 0; i < times; i++) {
        let randomVec = domain.elevate(Vector2.fromRandom(rng)).to3D();
        s.approxClosestPoint(randomVec);
    }

    sw.log(`created ${times} closest points`); // 326 ms
}

test();