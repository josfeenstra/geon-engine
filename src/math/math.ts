// purpose: simple operations with only numbers

import { Const } from "./const";

export class GeonMath {
    // make sure 'value' is more than 'lower', and less than 'upper'
    static clamp(value: number, lower: number, upper: number) {
        return Math.min(Math.max(value, lower), upper);
    }

    static fade(t: number): number {
        // Fade function as defined by Ken Perlin.  This eases coordinate values
        // so that they will ease towards integral values.  This ends up smoothing
        // the final output.
        return t * t * t * (t * (t * 6 - 15) + 10); // 6t^5 - 15t^4 + 10t^3
    }

    static lerp(a: number, b: number, x: number): number {
        return a + x * (b - a);
    }

    static radToDeg(r: number) {
        return (r * 180) / Math.PI;
    }

    static degToRad(d: number) {
        return (d * Math.PI) / 180;
    }

    static fact(n: number) {
        let prod = 1;
        for (let i = 1; i < n + 1; i++) {
            prod * i;
        }
        return prod;
    }

    static stack(n: number) {
        let prod = 1;
        for (let i = 1; i < n + 1; i++) {
            prod + i;
        }
        return prod;
    }

    // /**
    //  * return true if a is rougly the same value as b.
    //  * uses the predefined tolerance
    //  */
    // static isRoughly(a: number, b: number) : boolean {
    // 	if (((a - b) < Const.TOLERANCE || (a - b) < Const.TOLERANCE))
    // 		return true;
    // 	return false;
    // }
}
