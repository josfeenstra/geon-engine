// name:    intersect.ts
// author:  Jos Feenstra
// purpose: intersection utility functions

import { Const, Vector3 } from "../lib";

/**
 * @returns -1 if no intersection, 0 of parallel or touching, 1 if intersection;
 */
function lineXplane(l1: Vector3, l2: Vector3, p1: Vector3, p2: Vector3, p3: Vector3): number {
    let test1 = signed_volume(p1, p2, p3, l1);
    let test2 = signed_volume(p1, p2, p3, l2);
    if (Math.abs(test1) < Const.TOLERANCE || Math.abs(test2) < Const.TOLERANCE) {
        return 0; // triangle touches plane with an edge
    } else if ((test1 < 0 && test2 > 0) || (test1 > 0 && test2 < 0)) {
        return 1; // if 1 test pos and other negative -> line intersects plane!
    } else {
        return -1; // no intersection
    }
}

/**
 * Calculate if line and triangle intersect
 * 
 * NOTE we could expand on the 'return 0' and explore if its touching a
    vertex, line, or surface of triange
 * @returns 0  if line touches triangle
            -1 if line misses  triangle
             1  if line crosses triangle
 */
function lineXtriangle(l1: Vector3, l2: Vector3, p1: Vector3, p2: Vector3, p3: Vector3) {
    // line points must be on opposite sides of the triangle
    // return immidiately if -1: it means no intersection always
    let test0 = lineXplane(l1, l2, p1, p2, p3);
    if (test0 == -1) return -1;

    // plane tests
    let test1 = lineXplane(p1, p2, l1, l2, p3);
    if (test1 == -1) return -1;
    let test2 = lineXplane(p2, p3, l1, l2, p1);
    if (test2 == -1) return -1;
    let test3 = lineXplane(p3, p1, l1, l2, p2);
    if (test3 == -1) return -1;

    // debug
    // print("points: ", l1, l2, p1, p2, p3)
    // print('tests:', test0, test1, test2, test3)

    // figure out if the line touches the triangle, or if it intersects
    if (test0 == 1 && test1 == 1 && test2 == 1 && test3 == 1) {
        return 1;
    } else {
        // TODO based upon the different tests, we could determine what is hit
        return 0;
    }
}

function signed_volume(a: Vector3, b: Vector3, c: Vector3, d: Vector3) {
    // with vertices a,b,c,d: get signed volume
    // remember: vectors always remain state. We dont want to alter the abcd vectors.
    a = a.clone();
    b = b.clone();
    c = c.clone();
    return (
        (1 / 6) *
        a
            .clone()
            .sub(d)
            .dot(c.sub(d).cross(b.sub(d)))
    );
}

function IsRoughly(test1: number, arg1: number) {
    throw new Error("Function not implemented.");
}
