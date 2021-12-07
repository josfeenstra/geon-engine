import { Geometry } from "../geometry/Geometry";
import { Domain3, Util, Vector2 } from "../lib";
import { Matrix4 } from "../math/Matrix4";
import { Random } from "../math/Random";
import { Vector3 } from "../math/Vector3";
import { FloatMatrix } from "./FloatMatrix";
import { MultiVector } from "./MultiVector";
import { MultiVector2 } from "./MultiVector2";

export class MultiVector3 extends Geometry {
    constructor(private _matrix: FloatMatrix) {
        super();
    }

    static new(count: number) {
        return new MultiVector3(new FloatMatrix(3, count));
    }

    static fromList(vecs: Vector3[]): MultiVector3 {
        let length = vecs.length;
        let multi = MultiVector3.new(length);
        multi.fillFromList(vecs);
        return multi;
    }

    static fromNative(native: number[][]): MultiVector3 {
        // assume all subarrays have the same shape!!
        return new MultiVector3(FloatMatrix.fromNative(native));
    }

    static fromData(data: number[] | Float32Array): MultiVector3 {
        let multi = MultiVector3.new(data.length / 3);
        multi._matrix.fillWith(data);
        return multi;
    }

    static fromMatrix(data: FloatMatrix) {
        if (data.width != 3) {
            throw new Error("incorrect.");
        }
        return new MultiVector3(data);
    }

    // pass through

    private get width(): number {
        return this._matrix.width;
    }

    private get height(): number {
        return this._matrix.height;
    }

    public get dimensions(): number {
        return this._matrix.width;
    }

    public get count(): number {
        return this._matrix.height;
    }

    get matrix(): FloatMatrix {
        return this._matrix;
    }

    setXYZ(i: number, x: number, y: number, z: number) {
        this._matrix.data[i * this.width + 0] = x;
        this._matrix.data[i * this.width + 1] = y;
        this._matrix.data[i * this.width + 2] = z;
    }

    set(i: number, vec: Vector3) {
        this._matrix.data[i * this.width + 0] = vec.x;
        this._matrix.data[i * this.width + 1] = vec.y;
        this._matrix.data[i * this.width + 2] = vec.z;
    }

    get(i: number): Vector3 {
        return new Vector3(
            this._matrix.data[i * this.width + 0],
            this._matrix.data[i * this.width + 1],
            this._matrix.data[i * this.width + 2],
        );
    }

    /**
     * this copies the data to an existing vector
     */
    getCopy(vec: Vector3, i: number) {
        vec.x = this._matrix.data[i * this.width + 0];
        vec.y = this._matrix.data[i * this.width + 1];
        vec.z = this._matrix.data[i * this.width + 2];
    }

    slice() {
        return this._matrix;
    }

    fillFromList(vecs: Vector3[]) {
        for (let i = 0; i < vecs.length; i++) {
            this.set(i, vecs[i]);
        }
    }

    forEach(callbackfn: (value: Vector3, index: number) => any): MultiVector3 {
        for (let i = 0; i < this.count; i++) {
            let vec = this.get(i);
            vec = callbackfn(vec, i)!;
            if (vec instanceof Vector3) {
                this.set(i, vec);
            }
        }
        return this;
    }

    take(indices: number[]): MultiVector3 {
        // create a new floatarray
        const count = indices.length;
        let array = MultiVector3.new(count);
        for (let i = 0; i < count; i++) {
            let getIndex = indices[i];
            array.set(i, this.get(getIndex));
        }
        return array;
    }

    takeRange(start: number, end: number): MultiVector3 {
        let array = MultiVector3.new(end - start);
        let j = 0;
        for (let i = start; i < end; i++) {
            array.set(j, this.get(i));
            j++;
        }
        return array;
    }

    map(callbackfn: (value: Vector3, index: number) => Vector3): MultiVector3 {
        let clone = this.clone();

        for (let i = 0; i < this.count; i++) {
            let vec = this.get(i);
            let result = callbackfn(vec, i);
            clone.set(i, result);
        }
        return clone;
    }

    mapWith(other: MultiVector3, callback: (a: number, b: number) => number) {
        let result = this._matrix.mapWith(other._matrix, callback);
        return new MultiVector3(result);
    }

    toList(): Vector3[] {
        let vecs: Vector3[] = [];
        for (let i = 0; i < this.height; i++) {
            vecs.push(this.get(i));
        }
        return vecs;
    }

    to2D(): MultiVector2 {
        let vec2 = MultiVector2.new(this.count);
        this.forEach((v, i) => {
            vec2.setXY(i, v.x, v.y);
        });
        return vec2;
    }

    mean(): Vector3 {
        // the mean vector of a series of vectors
        let sum = Vector3.zero();

        let count = this.count;
        for (let i = 0; i < count; i++) {
            sum.x += this._matrix.data[i * 3];
            sum.y += this._matrix.data[i * 3 + 1];
            sum.z += this._matrix.data[i * 3 + 2];
        }

        return sum.scale(1 / count);
    }

    average(): Vector3 {
        return this.mean();
    }

    closestId(point: Vector3): number {
        let lowScore = Infinity;
        let id = -1;

        this.forEach((v, i) => {
            let disSquared = point.disToSquared(v);
            if (disSquared < lowScore) {
                lowScore = disSquared;
                id = i;
            }
        });
        return id;
    }

    closestIds(point: Vector3, n: number): number[] {
        // O(m*n)... TODO implement quicksort

        let ids: number[] = [];

        for (let i = 0; i < n; i++) {
            let lowScore = Infinity;
            let id = -1;
            this.forEach((v, i) => {
                if (ids.includes(id)) return;
                let disSquared = point.disToSquared(v);
                if (disSquared < lowScore) {
                    lowScore = disSquared;
                    id = i;
                }
            });
            ids.push(id);
        }
        return ids;
    }

    clone(): MultiVector3 {
        return new MultiVector3(this._matrix.clone());
    }

    transform(m: Matrix4): MultiVector3 {
        // THIS CAN BE SPEED UP: BOTH MATRIX 4 & VECTOR3ARRAY ARE JUST FLOAT-MATRICES
        // this.matrix = calc(this.matrix, m);

        // I DONT KNOW WHY, BUT THIS IS QUICKER THAN MATRIX MULTIPLICATION
        for (let i = 0; i < this.height; i++) {
            let vec = this.get(i);
            vec = m.multiplyVector(vec);
            this.set(i, vec);
        }
        return this;

        // // this.data = m.MultiplyM(this).data;
    }

    move(v: Vector3): MultiVector3 {
        for (let i = 0; i < this.height; i++) {
            let vec = this.get(i);
            vec.add(v);
            this.set(i, vec);
        }
        return this;
    }

    scale(s: Vector3): MultiVector3 {
        for (let i = 0; i < this.height; i++) {
            let vec = this.get(i);
            vec.mul(s);
            this.set(i, vec);
        }
        return this;
    }

    transformed(m: Matrix4): MultiVector3 {
        return new MultiVector3(calc(this._matrix, m));
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

function calc(a: FloatMatrix, b: Matrix4) {
    // we need to do something ugly here, because of the 4th column...
    // and while im at it, I specified the rest of the values as well, for speed's sake
    let product = new FloatMatrix(b.width, a.height);

    for (var i = 0; i < a.height; i++) {
        for (var j = 0; j < 4; j++) {
            for (var k = 0; k < 3; k++) {
                product.set(i, j, product.get(i, j) + a.get(i, k) * b.get(k, j));
            }
            product.set(i, j, product.get(i, j) + 1 * b.get(3, j));
        }
    }

    return product;
}

// function benchmark2() {
//     let sw = Stopwatch.new();

//     let count = 1000000;
//     let mv = MultiVector3.new(count);
//     let rng = Random.fromSeed(1337);
//     for (let i = 0; i < count; i++) {
//         mv.set(i, Vector3.fromRandomUnit(rng));
//     }
//     sw.log("v1: init");

//     let vecs = Array<Vector3>(count);
//     for (let i = 0; i < count; i++) {
//         vecs[i] = Vector3.fromRandomUnit(rng);
//     }

//     sw.log("v2: init");

//     let vecs3 = Array<Vector3>();
//     for (let i = 0; i < count; i++) {
//         vecs3.push(Vector3.fromRandomUnit(rng));
//     }

//     sw.log("v3: init");

//     // v1: init took: 123 ms
//     // v2: init took: 184 ms
//     // v3: init took: 469 ms
//     // conclusion: MultiVector3 works as intended!
// }
