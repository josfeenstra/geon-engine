import { MultiVector3 } from "../data/multi-vector-3";
import { Domain, Domain2 } from "./domain";
import { GeonMath } from "./math";
import { Vector2 } from "./vector";

export class Util {
    static range(n: number): number[] {
        let array: number[] = [];
        for (let i = 0; i < n; i++) {
            array.push(i);
        }
        return array;
    }

    static collect<T>(gen: Generator<T>): Array<T> {
        let arr = new Array<T>();
        for (let item of gen) {
            arr.push(item);
        }
        return arr;
    }

    /** binary-seach an equation, to get the smallest x.
     * from   : https://stackoverflow.com/questions/2742610/closest-point-on-a-cubic-bezier-curve/57315396#57315396
     * formatted differently 
     * ```
     * minX   : the smallest input value
     * maxX   : the largest input value
     * ƒ      : a function that returns a value `y` given an `x`
     * ε      : how close in `x` the bounds must be before returning
     * returns: the `x` value that produces the smallest `y`
     * ```
     */
    static lowestScore(domain: Domain, score: (x: number) => number, tol=1e-10) : number {
        let half = Infinity;

        // binary seach-like procedure:
        while ((domain.t1 - domain.t0) > tol) {
            half = (domain.t1 + domain.t0) / 2;
            if (score(half-tol) < score(half+tol)) {
                domain.t1 = half;
            } else {
                domain.t0 = half;
            }   
        }
        return half;
    }

    static lowestScoreSquared(domain: Domain2, score: (x: number, y: number) => number, tol=1e-10) : Vector2 {
        let halfX = Infinity;
        let halfY = Infinity;

        // binary seach-like procedure:
        while ((domain.x.t1 - domain.x.t0) > tol || (domain.y.t1 - domain.y.t0) > tol) {

            halfX = (domain.x.t1 + domain.x.t0) / 2;
            halfY = (domain.y.t1 + domain.y.t0) / 2;
            
            // select smallest quadrant
            if (score(halfX-tol, halfY) < score(halfX+tol, halfY)) {
                domain.x.t1 = halfX;
            } else {
                domain.x.t0 = halfX;
            }   
            if (score(halfX, halfY-tol) < score(halfX, halfY+tol)) {
                domain.y.t1 = halfY;
            } else {
                domain.y.t0 = halfY;
            }
        }
        return Vector2.new(halfX, halfY);
    }

    //      triangle business
    // ============================

    /**
     * ```
     *         column
     *      4  3  2  1  0
     *   0 |>
     * r 1 |>     >
     * o 2 |>     >     >
     * w 3 |>     >
     *   4 |>
     *
        for (let col = size - 1; col > -1; col -= 1) {
            for (let row = 0; row <= col; row++) {
                let idx = Util.iterateTriangle(col, row);
            }
        }
     * ```
     */
    static iterateTriangle(column: number, row: number): number {
        return GeonMath.stack(column) + row;
    }

    static getTriangleBase(triangle: MultiVector3, size: number) {
        let base = MultiVector3.new(size);
        let basecolumn = size - 1;
        let i = 0;
        for (let row = 0; row <= basecolumn; row++) {
            let idx = Util.iterateTriangle(basecolumn, row);
            base.set(i, triangle.get(idx));
            i++;
        }
        return base;
    }

    static getTriangleLeft(triangle: MultiVector3, size: number) {
        // prepare
        let left = MultiVector3.new(size);

        // the two edges of the triangle opposite to the base are the vertices we are interested in
        let i = 0;
        for (let col = size - 1; col > -1; col -= 1) {
            left.set(i, triangle.get(Util.iterateTriangle(col, 0)));
            i++;
        }

        return left;
    }

    static getTriangleRight(triangle: MultiVector3, size: number) {
        // prepare
        let right = MultiVector3.new(size);

        // the two edges of the triangle opposite to the base are the vertices we are interested in
        let i = 0;
        for (let col = size - 1; col > -1; col -= 1) {
            right.set(i, triangle.get(Util.iterateTriangle(col, col)));
            i++;
        }

        return right;
    }
}
