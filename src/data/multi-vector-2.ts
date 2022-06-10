import { Geo } from "../geo/geo";
import { Matrix4 } from "../math/matrix";
import { Vector2 } from "../math/vector";
import { FloatMatrix } from "./float-matrix";
import { MultiVector3 } from "./multi-vector-3";

export class MultiVector2 extends Geo {
    private constructor(private matrix: FloatMatrix) {
        super();
    }

    static new(length: number): MultiVector2 {
        return new MultiVector2(new FloatMatrix(length, 2));
    }

    static fromList(vecs: Vector2[]): MultiVector2 {
        let length = vecs.length;
        let multiVector = MultiVector2.new(length);
        for (let i = 0; i < vecs.length; i++) {
            multiVector.matrix.set(i, 0, vecs[i].x);
            multiVector.matrix.set(i, 1, vecs[i].y);
        }
        return multiVector;
    }

    static fromMatrix(data: FloatMatrix): MultiVector2 {
        if (data.width != 2) {
            throw new Error("incorrect.");
        }
        return new MultiVector2(data);
    }

    static fromData(data: number[] | Float32Array): MultiVector2 {
        let multi = MultiVector2.new(data.length / 2);
        multi.matrix.fillWith(data);
        return multi;
    }

    // pass through

    private get width(): number {
        return this.matrix.width;
    }

    private get height(): number {
        return this.matrix.height;
    }

    public get dimensions(): number {
        return this.matrix.width;
    }

    public get count(): number {
        return this.matrix.height;
    }

    forEach(callbackfn: (value: Vector2, index: number) => void): MultiVector2 {
        for (let i = 0; i < this.count; i++) {
            let vec = this.get(i);
            callbackfn(vec, i);
            this.set(i, vec);
        }
        return this;
    }

    map(callbackfn: (value: Vector2, index: number) => any): MultiVector2 {
        let clone = this.clone();

        for (let i = 0; i < this.count; i++) {
            let vec = this.get(i);
            let result = callbackfn(vec, i)!;
            if (result instanceof Vector2) {
                clone.set(i, result);
            } else {
                clone.set(i, vec);
            }
        }
        return clone;
    }

    set(i: number, vec: Vector2) {
        this.matrix.data[i * this.matrix.width + 0] = vec.x;
        this.matrix.data[i * this.matrix.width + 1] = vec.y;
    }

    setXY(i: number, x: number, y: number) {
        this.matrix.data[i * this.matrix.width + 0] = x;
        this.matrix.data[i * this.matrix.width + 1] = y;
    }

    get(i: number): Vector2 {
        return new Vector2(
            this.matrix.data[i * this.width + 0],
            this.matrix.data[i * this.width + 1],
        );
    }

    /**
     *  This is a Slice! Edit the matrix = edit the MultiVector!
     */
    toMatrixSlice() {
        return this.matrix;
    }

    toList(): Vector2[] {
        let vecs: Vector2[] = [];
        for (let i = 0; i < this.height; i++) {
            vecs.push(this.get(i));
        }
        return vecs;
    }

    to3D(): MultiVector3 {
        let vecs = MultiVector3.new(this.count);
        for (let i = 0; i < this.count; i++) {
            let row = this.matrix.getRow(i);
            vecs.setXYZ(i, row[0], row[1], 0);
        }
        return vecs;
    }

    clone(): MultiVector2 {
        let clone = MultiVector2.new(this.count);
        clone.matrix = this.matrix.clone();
        return clone;
    }

    transform(m: Matrix4): MultiVector2 {
        this.matrix.multiply(m);
        return this;
    }

    transformed(m: Matrix4): MultiVector2 {
        let clone = MultiVector2.new(this.count);
        clone.matrix = this.matrix.multiplied(m);
        return clone;
    }
}
