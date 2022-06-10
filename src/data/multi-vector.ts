// name:    array.ts
// author:  Jos Feenstra
// purpose: Small wrapper around Float32Array / FloatMatrix to add interoperability with Vector2 & Vector3,
//          while remaining a datastructure thats easy to pass over to webgl
//
// NOTE:    all these small wrappers might not be good pratice, but I
//          like to extract simple logic like this to not clutter the code too much

import { FloatMatrix, MultiVector2, MultiVector3, Vector2, Vector3 } from "../lib";

export type MultiVector = FloatMatrix | MultiVector2 | MultiVector3 | Vector2[] | Vector3[];

export function ToFloatMatrix(vectors: MultiVector): FloatMatrix {
    if (vectors instanceof FloatMatrix) {
        return vectors;
    } else if (vectors instanceof MultiVector2) {
        return vectors.toMatrixSlice();
    } else if (vectors instanceof MultiVector3) {
        return vectors.slice();
    } else if (vectors[0] instanceof Vector2) {
        return MultiVector2.fromList(vectors as Vector2[]).toMatrixSlice();
    } else {
        return MultiVector3.fromList(vectors as Vector3[]).slice();
    }
}
