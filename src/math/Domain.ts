// domain.ts
//
// author: Jos Feenstra
// purpose: general representation of a domain / range / bound of numbers

// TODO: give domain a stride / step. 
//       - redivide 
//       - fromDivide()
//       - default: 1 
//       - 

import { Matrix4, MultiVector2, MultiVector3, Vector3 } from "../lib";
import { Vector2 } from "./Vector2";
import { Stopwatch } from "../util/Stopwatch";
import { Random } from "./Random";

export class Domain {
    // note: including t0, including t1
    size: number;

    constructor(public t0 = 0.0, public  t1 = 1.0) {
        // if (t0 > t1) console.error("created a domain with negative size.");
        // if (t0 == t1) console.warn("created a domain with size is 0.0. could cause problems");
        this.size = this.t1 - this.t0;
    }

    static new(t0 = 0, t1 = 1) {
        return new Domain(t0, t1);
    }

    static fromRadius(r: number): Domain {
        return new Domain(-r, r);
    }

    static fromInclude(data: Float32Array): Domain {
        // create a new domain which bounds all parsed values
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < data.length; i++) {
            if (data[i] < min) min = data[i];
            if (data[i] > max) max = data[i];
        }
        return new Domain(min, max);
    }

    offset(t0Offset: number, t1Offset: number) {
        this.t0 += t0Offset;
        this.t1 += t1Offset;
        this.size = this.t1 - this.t0;
        return this;
    }

    includes(value: number): boolean {
        // note: including t0, including t1
        return value >= this.t0 && value <= this.t1;
    }

    includesEx(value: number): boolean {
        // note: including t0, exccluding t1
        return value >= this.t0 && value < this.t1;
    }

    normalize(value: number): number {
        // normalize a parameter
        return (value - this.t0) / this.size;
    }

    /**
     * elevate a normalized parameter onto this domain
     * @param t normalized parameter t in domain 0--1
     * @returns parameter in domains numerical space
     */
    elevate(t: number): number {
        // elevate a normalized parameter to the parameter space of this domain
        return t * this.size + this.t0;
    }

    /**
     * Exact same thing as elevate
     */
    lerp(t: number): number {
        return this.elevate(t);
    }

    remap(value: number, other: Domain = new Domain()): number {
        // normalize a value, then elevate it to a new domain
        let norm = this.normalize(value);
        return other.elevate(norm);
    }

    /**
     * generate `count` values evenly distributed along the domain.
     */
    spawn(count: number): Float32Array {
        // this is almost 100x slower
        // return new Float32Array(this.iter(count));

        let result = new Float32Array(count);
        let step = this.size / (count - 1);
        for (let i = 0; i < count; i++) {
            result[i] = this.t0 + i * step;
        }
        return result;
    }

    *iter(count: number): Generator<number> {
        // iterate over this Domain 'count' number of times
        let step = this.size / (count - 1);
        for (let i = 0; i < count; i++) {
            let val = this.t0 + i * step;
            yield val;
        }
    }

    *iterStep(step: number): Generator<number> {
        // iterate over this domain with a stepsize of 'step'
        for (let i = this.t0; i <= this.t1; i += step) {
            yield i;
        }
    }

    // comform a number to the bound
    comform(value: number) {
        if (value < this.t0) {
            return this.t0;
        } else if (value > this.t1) {
            return this.t1;
        } else {
            return value;
        }
    }
}

export class Domain2 {
    // 2D domain. logic cascades down to the 1 dimentional Domain.

    x: Domain;
    y: Domain;

    constructor(x: Domain = new Domain(), y: Domain = new Domain()) {
        this.x = x;
        this.y = y;
    }

    static fromRadii(rx: number, ry: number): Domain2 {
        return new Domain2(Domain.fromRadius(rx), Domain.fromRadius(ry));
    }

    static fromRadius(r: number): Domain2 {
        return new Domain2(Domain.fromRadius(r), Domain.fromRadius(r));
    }

    static fromBounds(x0: number, x1: number, y0: number, y1: number): Domain2 {
        return new Domain2(new Domain(x0, x1), new Domain(y0, y1));
    }

    static fromWH(x: number, y: number, w: number, h: number): Domain2 {
        return new Domain2(new Domain(x, x + w), new Domain(y, y + h));
    }

    static fromInclude(data: MultiVector2): Domain2 {
        // note : could be quicker by going verbose, this now iterates over data 4 times
        let mat = data.toMatrixSlice();
        return new Domain2(
            Domain.fromInclude(mat.getColumn(0)),
            Domain.fromInclude(mat.getColumn(1)),
        );
    }

    

    offset(xXyYoffset: number[]) {
        let off = xXyYoffset;
        if (off.length != 4) throw "need 4 values";

        this.x.offset(off[0], off[1]);
        this.y.offset(off[2], off[3]);
        return this;
    }

    includes(value: Vector2): boolean {
        // note: including t0, including t1
        return this.x.includes(value.x) && this.y.includes(value.y);
    }

    includesEx(value: Vector2): boolean {
        // note: including t0, including t1
        return this.x.includesEx(value.x) && this.y.includesEx(value.y);
    }

    size(): Vector2 {
        // the size or length of this domain
        return new Vector2(this.x.size, this.y.size);
    }

    normalize(value: Vector2): Vector2 {
        // normalize a parameter
        return new Vector2(this.x.normalize(value.x), this.y.normalize(value.y));
    }

    elevate(t: Vector2): Vector2 {
        // elevate a normalized parameter to the parameter space of this domain
        return new Vector2(this.x.elevate(t.x), this.y.elevate(t.y));
    }

    remap(value: Vector2, other: Domain2 = new Domain2()): Vector2 {
        // normalize a value, then elevate it to a new domain
        let norm = this.normalize(value);
        return other.elevate(norm);
    }

    corners(): Vector2[] {
        // render the extends of this boundary / domain
        let dim = 2;
        let data = [];
        for (let x of [this.x.t0, this.x.t1]) {
            for (let y of [this.y.t0, this.y.t1]) {
                data.push(new Vector2(x, y));
            }
        }
        return data;
    }

    /**
     * generate `countX * CountY` vector2's evenly distributed along the domain.
     */
    spawn(countX: number, countY: number) {
        // iterate over this Domain 'count' number of times
        let result = MultiVector2.new(countX * countY);
        let i = 0;

        let yRange = this.y.spawn(countY);
        let xRange = this.x.spawn(countX);
        for (const y of yRange) {
            for (const x of xRange) {
                result.setXY(i, x, y);
                i++;
            }
        }
        return result;
    }

    /**
     * Generate a bunch of random points
     */
    populate(count: number, rng: Random) {
        let result = MultiVector2.new(count);
        for (let i = 0; i < result.count; i++) {
            result.set(i, this.elevate(Vector2.fromRandom(rng)));
        }
        return result;
    }
}

export class Domain3 {
    x: Domain;
    y: Domain;
    z: Domain;

    constructor(x: Domain = new Domain(), y: Domain = new Domain(), z: Domain = new Domain()) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static fromVectors(lower=Vector3.zero(), upper=Vector3.new(1,1,1)) {
        return new Domain3(new Domain(lower.x, upper.x), new Domain(lower.y, upper.y), new Domain(lower.z, upper.z))
    }

    static fromBounds(
        x0: number,
        x1: number,
        y0: number,
        y1: number,
        z0: number,
        z1: number,
    ): Domain3 {
        return new Domain3(new Domain(x0, x1), new Domain(y0, y1), new Domain(z0, z1));
    }

    static fromRadius(r: number): Domain3 {
        return new Domain3(Domain.fromRadius(r), Domain.fromRadius(r), Domain.fromRadius(r));
    }

    static fromRadii(rx: number, ry: number, rz: number): Domain3 {
        return new Domain3(Domain.fromRadius(rx), Domain.fromRadius(ry), Domain.fromRadius(rz));
    }

    static fromInclude(data: MultiVector3): Domain3 {
        // note : could be quicker by going verbose, this now iterates over data 6 times
        return new Domain3(
            Domain.fromInclude(data.slice().getColumn(0)),
            Domain.fromInclude(data.slice().getColumn(1)),
            Domain.fromInclude(data.slice().getColumn(2)),
        );
    }

    offset(xXyYoffset: number[]) {
        let off = xXyYoffset;
        if (off.length != 6) throw "need 6 values";

        this.x.offset(off[0], off[1]);
        this.y.offset(off[2], off[3]);
        this.z.offset(off[4], off[5]);
        return this;
    }

    includes(value: Vector3): boolean {
        // note: including t0, including t1
        return this.x.includes(value.x) && this.y.includes(value.y) && this.z.includes(value.z);
    }

    size(): Vector3 {
        // the size or length of this domain
        return new Vector3(this.x.size, this.y.size, this.z.size);
    }

    normalize(value: Vector3): Vector3 {
        // normalize a parameter
        return new Vector3(
            this.x.normalize(value.x),
            this.y.normalize(value.y),
            this.z.normalize(value.z),
        );
    }

    elevate(t: Vector3): Vector3 {
        // elevate a normalized parameter to the parameter space of this domain
        return new Vector3(this.x.elevate(t.x), this.y.elevate(t.y), this.z.elevate(t.z));
    }

    remap(value: Vector3, other: Domain3 = new Domain3()): Vector3 {
        // normalize a value, then elevate it to a new domain
        let norm = this.normalize(value);
        return other.elevate(norm);
    }

    remapAll(values: MultiVector3, other: Domain3 = new Domain3()): MultiVector3 {
        // normalize a value, then elevate it to a new domain
        let newValues = MultiVector3.new(values.count);
        for (let i = 0; i < values.count; i++) {
            let norm = this.normalize(values.get(i));
            newValues.set(i, other.elevate(norm));
        }
        return newValues;
    }

    corners(matrix: Matrix4): Vector3[] {
        // render the extends of this boundary / domain
        let dim = 3;
        let corners = 2 ^ dim;
        let data = [];
        for (let x of [this.x.t0, this.x.t1]) {
            for (let y of [this.y.t0, this.y.t1]) {
                for (let z of [this.z.t0, this.z.t1]) {
                    data.push(matrix.multiplyVector(new Vector3(x, y, z)));
                }
            }
        }
        return data;
    }

    /**
     * generate `countX * countY * countZ` vector3's evenly distributed along the domain.
     */
    spawn(countX: number, countY: number, countZ: number) {
        // iterate over this Domain 'count' number of times
        let result = MultiVector3.new(countX * countY);
        let i = 0;

        // this looks dumb, i have tried other methods, this is still the fastest...
        let zRange = this.z.spawn(countZ);
        let yRange = this.y.spawn(countY);
        let xRange = this.x.spawn(countX);
        for (const z of zRange) {
            for (const y of yRange) {
                for (const x of xRange) {
                    result.setXYZ(i, x, y, z);
                    i++;
                }
            }
        }
        return result;
    }

    /**
     * Generate a bunch of random points
     */
    populate(count: number, rng: Random) {
        let result = MultiVector3.new(count);
        for (let i = 0; i < result.count; i++) {
            result.set(i, this.elevate(Vector3.fromRandom(rng)));
        }
        return result;
    }
}

function benchmark() {
    // GENERAL BENCHMARKING CONCLUSIONS
    // use typedarrays
    // do not use yield. Its just not how javascript likes to function, often 100x slower
    let sw = Stopwatch.new();

    let domain = Domain2.fromRadius(5);

    sw.log("init");

    let count = 1000;
    domain.spawn(count, count);
    sw.log("spawn1");
}
