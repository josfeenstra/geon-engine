// generic all-pupose matrix of ints
export class IntMatrix {
    data: Uint16Array; //  change
    _width: number;
    _height: number;

    constructor(height: number, width: number, data: number[] = []) {
        this._height = height;
        this._width = width;
        this.data = new Uint16Array(this._width * this._height);
        if (data == [] || data.length == 0) this.fill(0);
        else this.setData(data);
    }

    static fromList(list: number[], width: number): IntMatrix {
        let height = list.length / width;
        let array = new IntMatrix(height, width);
        for (let i = 0; i < list.length; i++) {
            array.data[i] = list[i];
        }
        return array;
    }

    print() {
        let strings: string[] = [];
        const WIDTH = 8;
        for (var i = 0; i < this._height; i++) {
            strings.push("|");
            for (var j = 0; j < this._width; j++) {
                let str = this.get(i, j).toFixed(2);
                str = str.padStart(WIDTH, " ");
                strings.push(str);

                if (j < this._width - 2) {
                    strings.push("  ");
                }
            }
            strings.push("  |\n");
        }
        console.log(strings.join(""));
    }

    clone() {
        let clone = new IntMatrix(this._height, this._width);
        clone.data = this.data;
        return clone;
    }

    setData(data: number[]) {
        if (data.length != this._height * this._width)
            throw "data.length does not match width * height " + data.length.toString();
        this.data.set(data);
    }

    count() {
        // number of entries / rows.
        // when derrived classes ask for 'how many of x?' they usually mean this.
        return this._height;
    }

    getDimensions(): [number, number] {
        return [this._height, this._width];
    }

    inRange(i: number, j: number): boolean {
        return !(i < 0 || i > this._height - 1 || j < 0 || j > this._width - 1);
    }

    fill(value: number) {
        let size = this._height * this._width;
        for (let i = 0; i < size; i++) {
            this.data[i] = value;
        }
    }

    fillWith(data: number[], valuesPerEntry: number = this._width) {
        // values per entry can be used to setData which is not of the same shape.
        let vpe = valuesPerEntry;
        if (vpe > this._width)
            throw "values per entry is larger than this._width. This will spill over.";
        for (let i = 0; i < this._height; i++) {
            for (let j = 0; j < vpe; j++) {
                this.set(i, j, data[i * vpe + j]);
            }
        }
    }

    get(i: number, j: number): number {
        if (!this.inRange(i, j)) {
            console.warn("out of range!");
            return 0;
        }
        return this.data[i * this._width + j];
    }

    getRow(i: number): Uint16Array {
        // if (i < 0 || i > this.height) throw "column is out of bounds for Array"
        let data = new Uint16Array(this._width);
        for (let j = 0; j < this._width; j++) {
            data[j] = this.get(i, j);
        }
        return data;
    }

    getColumn(j: number): Uint16Array {
        // if (j < 0 || j > this.width) throw "column is out of bounds for Array"
        let data = new Uint16Array(this._height);
        for (let i = 0; i < this._height; i++) {
            let index = i * this._width + j;
            data[i] = this.data[index];
        }
        return data;
    }

    set(i: number, j: number, value: number) {
        if (!this.inRange(i, j)) {
            console.warn("out of range!");
            return;
        }
        this.data[i * this._width + j] = value;
    }

    setRow(rowIndex: number, row: number[] | Uint16Array) {
        // if (this.width != row.length) throw "dimention of floatarray is not " + row.length;
        for (let j = 0; j < this._width; j++) {
            this.set(rowIndex, j, row[j]);
        }
    }

    takeRows(indices: number[]): IntMatrix {
        // create a new array from a couple of rows
        console.log(this._height, this._width);
        const count = indices.length;
        let array = new IntMatrix(count, this._width);
        for (let i = 0; i < count; i++) {
            let getIndex = indices[i];
            array.setRow(i, this.getRow(getIndex));
        }
        return array;
    }

    getData(): Uint16Array {
        return this.data;
    }

    forEachValue(callbackfn: (value: number, index: number) => number): IntMatrix {
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = callbackfn(this.data[i], i);
        }
        return this;
    }

    forEachRow(callbackfn: (value: Uint16Array, index: number) => void): IntMatrix {
        for (let i = 0; i < this._height; i++) {
            let row = this.getRow(i);
            callbackfn(row, i);
            this.setRow(i, row);
        }
        return this;
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
