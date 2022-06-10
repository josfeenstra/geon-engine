import { Vector3 } from "../math/vector";

// a Cube of voxels
export class IntCube {
    data: Int32Array;
    _width: number;
    _height: number;
    _depth: number;

    constructor(height: number, width: number, depth: number, data: number[] = []) {
        this._height = height;
        this._width = width;
        this._depth = depth;
        let size = this._width * this._height * this._depth;
        this.data = new Int32Array(size);
        if (data == [] || data.length == 0) this.fill(0);
        else {
            this.setData(data);
        }
    }

    size(): number {
        return this._width * this._height * this._depth;
    }

    // shallow copy
    clone() {
        let clone = new IntCube(this._height, this._width, this._depth);
        clone.data = this.data;
        return clone;
    }

    setData(data: number[]) {
        if (data.length != this.size()) throw "data.length does not match width * height " + data.length.toString();
        this.data.set(data);
    }

    fill(value: number) {
        let size = this.size();
        for (let i = 0; i < size; i++) {
            this.data[i] = value;
        }
    }

    inRange(i: number, j: number, k: number): boolean {
        return !(i < 0 || j < 0 || k < 0 || i > this._width - 1 || j > this._height - 1 || k > this._depth - 1);
    }

    getIndex(i: number, j: number, k: number): number {
        return i * (this._height * this._depth) + j * this._depth + k;
    }

    getCoords(index: number): Vector3 {
        // javascript, dont you dare turn  'int / int' into a float...
        let i = Math.floor(index / (this._height * this._depth)) % this._width;
        let j = Math.floor(index / this._depth) % this._height;
        let k = index % this._depth;

        return new Vector3(i, j, k);
    }

    get(i: number, j: number, k: number): number | undefined {
        return this.data[this.getIndex(i, j, k)];
    }

    tryGet(i: number, j: number, k: number): number | undefined {
        if (this.inRange(i, j, k)) {
            return this.data[this.getIndex(i, j, k)];
        } else {
            return;
        }
    }

    set(i: number, j: number, k: number, value: number) {
        this.data[this.getIndex(i, j, k)] = value;
    }

    trySet(i: number, j: number, k: number, value: number) {
        if (this.inRange(i, j, k)) {
            this.data[this.getIndex(i, j, k)] = value;
        }
    }

    iter(callbackfn: (value: number, index: number) => void) {
        for (let i = 0; i < this.data.length; i++) {
            callbackfn(this.data[i], i);
        }
    }

    map(callbackfn: (value: number, index: number) => number) {
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = callbackfn(this.data[i], i);
        }
    }

    trueForAll(callbackfn: (value: number, index: number) => boolean): boolean {
        for (let i = 0; i < this.data.length; i++) {
            if (!callbackfn(this.data[i], i)) {
                return false;
            }
        }
        return true;
    }
}
