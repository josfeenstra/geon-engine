// name:    spline.ts
// author:  Jos Feenstra
// purpose: base interface / abstract classes for surfaces
// todo : research this : https://graphics.pixar.com/library/HarmonicCoordinates/
// todo : and this : https://doc.cgal.org/latest/Barycentric_coordinates_2/index.html

import { Geo, Mesh, Vector3 } from "../../lib";
/**
 * Any Surface. Maybe this will be expanded upon sometime in the future?
 */
export abstract class Surface extends Geo {}

/**
 * Bidirectional surface
 */
export abstract class BiSurface extends Surface {
    abstract pointAt(u: number, v: number): Vector3;

    buffer(uSegments=100, vSegments=100): Mesh {
        return Mesh.fromBiSurface(this, uSegments, vSegments);
    }
}

/**
 * Tridirectional surface
 */
export abstract class TriSurface extends Surface {
    abstract pointAt(u: number, v: number, w: number): Vector3;

    buffer(segments: number): Mesh {
        return Mesh.fromTriSurface(this, segments);
    }
}
