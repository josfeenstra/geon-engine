// purpose: a 'swiss cheese' data structure. When indices need to stay consistent, but you still want to iterate through a list, you need a data structure like this.

export class Pool<T> {
    private constructor(
        public _array: Array<T | undefined>, // set length buffer / array. This way, we are not dynamicly allocating anything. speed speed speed!
        public _limit = 0, // optimization : set it to the highest index added. we will ever have to iterate past this. speed speed speed!
    ) {}

    static new<T>(size: number | undefined): Pool<T> {
        return new Pool<T>(new Array(size));
    }

    add(item: T): number {
        // add at the first empty spot
        for (let i = 0; i < this._array.length; i++) {
            if (!this._array[i]) {
                this._array[i] = item;

                if (i > this._limit) {
                    this._limit = i + 1;
                }

                return i;
            }
        }

        // its full
        return -1;
    }

    delete(item: T): boolean {
        // turn item into empty spot
        for (let i = 0; i < this._limit; i++) {
            let r = this._array[i];
            if (r === item) {
                this.deleteAt(i);
                return true;
            }
        }

        // couldnt be found
        return false;
    }

    isValid(i: number): boolean {
        return i < 0 || i > this._array.length - 1;
    }

    deleteAt(i: number): boolean {
        // directly turn spot into empty spot
        if (this.isValid(i)) {
            this._array[i] = undefined;
            return true;
        }

        // out of range
        return false;
    }

    clean(callback: (newIndex: number, oldIndex: number) => void) {
        // remove all empty spots in between
        let offset = 0;
        for (let i = 0; i < this._limit; i++) {
            if (!this._array[i]) {
                offset -= 1;
            } else {
                this._array[i + offset] = this._array[i];
                callback(i + offset, i); // this can be used to clean something else alongside this one.
            }
        }
    }

    reset() {
        // set everything to default
        this._array = new Array<T>(this._array.length);
        this._limit = 0;
    }

    iter(callback: (i: number, item: T) => void) {
        for (let i = 0; i < this._limit; i++) {
            if (this._array[i]) {
                callback(i, this._array[i]!);
            }
        }
    }
}
