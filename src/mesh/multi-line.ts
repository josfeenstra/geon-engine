// name:    line-render-data.ts
// author:  Jos Feenstra
// purpose: represents an object which can be fed directly to a linerenderer.
//          use it to not continuously have to calculate these aspects if the underlying object is unchanged.

import { MultiVector } from "../data/multi-vector";
import {
    FloatMatrix,
    Vector2,
    Vector3,
    MultiVector2,
    MultiVector3,
    ToFloatMatrix,
    Plane,
    Const,
    Circle3,
    Polyline,
    Bezier,
    Cube,
    ShaderMesh,
} from "../lib";

// represents a collection of multiple lines. These could form 1 polyline, but this is not a requirement
export class MultiLine {
    verts: FloatMatrix;
    links: Uint16Array;

    private constructor(verts: MultiVector, ids?: Uint16Array) {
        this.verts = ToFloatMatrix(verts);
        if (ids == undefined) {
            this.links = getDefaultIndices(this.verts.height);
        } else {
            this.links = ids;
        }
    }

    // this assumes even vectices are 'from' points, and odd vertices are 'to' points
    static fromLines(verts: Vector2[] | Vector3[] | MultiVector2 | MultiVector3) {
        let data = ToFloatMatrix(verts);
        return new MultiLine(data);
    }

    // get all lines from a mesh
    static fromMesh(rend: ShaderMesh, uv = false): MultiLine {
        // 3 edges per face, 2 indices per edge
        let mesh = rend.mesh;
        let count = mesh.links.count() * 6;
        let data = new Uint16Array(count);
        for (let i = 0; i < mesh.links.count(); i++) {
            let iData = i * 6;
            data[iData] = mesh.links.get(i, 0);
            data[iData + 1] = mesh.links.get(i, 1);
            data[iData + 2] = mesh.links.get(i, 1);
            data[iData + 3] = mesh.links.get(i, 2);
            data[iData + 4] = mesh.links.get(i, 2);
            data[iData + 5] = mesh.links.get(i, 0);
        }
        if (uv) {
            return new MultiLine(rend.uvs.toMatrixSlice(), data);
        } else {
            return new MultiLine(mesh.verts.slice(), data);
        }
    }

    // create lines as a grid centered at a plane
    static fromGrid(plane: Plane, count: number, dis: number) {
        let halfTotalSize = ((count - 1) * dis) / 2;

        // 2 vectors per line, 2 lines per count
        // plus 5 lines, for ihat and jhat icons
        let lines = MultiVector3.new(count * 4);

        // x lines
        for (let i = 0; i < count; i++) {
            let t = -halfTotalSize + dis * i;
            lines.set(i * 2, new Vector3(t, -halfTotalSize, 0));
            lines.set(i * 2 + 1, new Vector3(t, halfTotalSize, 0));
        }

        // y lines
        for (let i = 0; i < count; i++) {
            let t = -halfTotalSize + dis * i;
            lines.set(2 * count + i * 2, new Vector3(-halfTotalSize, -halfTotalSize + dis * i, 0));
            lines.set(
                2 * count + i * 2 + 1,
                new Vector3(halfTotalSize, -halfTotalSize + dis * i, 0),
            );
        }

        // finally, transform everything to worldspace, and create the linerenderdata object
        lines.forEach((v) => plane.pushToWorld(v));
        return new MultiLine(lines.slice());
    }

    // get all lines from a plane
    static fromPlane(plane: Plane): MultiLine {
        let count = Const.PLANE_RENDER_LINECOUNT;
        let dis = Const.PLANE_RENDER_LINEDISTANCE;
        let disSmall = dis / 10;
        let halfTotalSize = ((count - 1) * dis) / 2;

        // 2 vectors per line, 2 lines per count
        // plus 5 lines, for ihat and jhat icons
        let lines = MultiVector3.new(count * 4 + 5 * 2);

        // x lines
        for (let i = 0; i < count; i++) {
            let t = -halfTotalSize + dis * i;
            lines.set(i * 2, new Vector3(t, -halfTotalSize, 0));
            lines.set(i * 2 + 1, new Vector3(t, halfTotalSize, 0));
        }

        // y lines
        for (let i = 0; i < count; i++) {
            let t = -halfTotalSize + dis * i;
            lines.set(2 * count + i * 2, new Vector3(-halfTotalSize, -halfTotalSize + dis * i, 0));
            lines.set(
                2 * count + i * 2 + 1,
                new Vector3(halfTotalSize, -halfTotalSize + dis * i, 0),
            );
        }

        // icon I  to show ihat
        let iconLine1 = lines.count - 10;
        lines.set(iconLine1, new Vector3(halfTotalSize + disSmall, -disSmall, 0));
        lines.set(iconLine1 + 1, new Vector3(halfTotalSize + disSmall * 4, disSmall, 0));

        let iconLine2 = lines.count - 8;
        lines.set(iconLine2, new Vector3(halfTotalSize + disSmall, disSmall, 0));
        lines.set(iconLine2 + 1, new Vector3(halfTotalSize + disSmall * 4, -disSmall, 0));

        // icon II to show jhat
        let iconLine3 = lines.count - 6;
        lines.set(iconLine3, new Vector3(0, halfTotalSize + disSmall * 2.5, 0));
        lines.set(iconLine3 + 1, new Vector3(disSmall, halfTotalSize + disSmall * 4, 0));

        let iconLine4 = lines.count - 4;
        lines.set(iconLine4, new Vector3(disSmall, halfTotalSize + disSmall, 0));
        lines.set(iconLine4 + 1, new Vector3(-disSmall, halfTotalSize + disSmall * 4, 0));

        // icon III to show khat / normal direction
        let iconLine5 = lines.count - 2;
        lines.set(iconLine5, new Vector3(0, 0, 0));
        lines.set(iconLine5 + 1, new Vector3(0, 0, dis));

        // finally, transform everything to worldspace, and create the linerenderdata object
        lines.forEach((v) => plane.pushToWorld(v));
        return new MultiLine(lines.slice());
    }

    static fromCircle(c: Circle3, numSegments = Const.CIRCLE_SEGMENTS): MultiLine {
        let count = numSegments;
        let verts = MultiVector3.new(count);

        // x lines
        for (let i = 0; i < count; i++) {
            // radial fraction of a circle
            let t = (i / count) * (Math.PI * 2);
            verts.set(
                i,
                c.plane.pushToWorld(new Vector3(Math.cos(t) * c.radius, Math.sin(t) * c.radius, 0)),
            );
        }
        return new MultiLine(verts.slice(), getPairIndices(count, true));
    }

    static fromPolyline(p: Polyline) {
        return new MultiLine(p.verts, getPairIndices(p.verts.count, false));
    }

    static fromBezier(b: Bezier, numSegments = Const.BEZIER_SEGMENTS) {
        let count = numSegments + 1;
        let verts = MultiVector3.new(count);
        for (let i = 0; i < count; i++) {
            // fraction
            let t = i / numSegments;
            verts.set(i, b.pointAt(t));
        }
        return new MultiLine(verts.slice(), getPairIndices(count, false));
    }

    static fromCube(cube: Cube): MultiLine {
        let verts = MultiVector3.fromList(cube.getCorners());

        return new MultiLine(verts);
    }

    static fromJoin(lines: MultiLine[]): MultiLine {
        // join meshes, dont try to look for duplicate vertices
        // TODO : make this the trouble of Matrices and Arrays
        let idsCount = 0;
        let vertCount = 0;
        for (let line of lines) {
            idsCount += line.links.length;
            vertCount += line.verts.count();
        }

        let verts = MultiVector3.new(vertCount);
        let ids = new Uint16Array(idsCount);

        let accVerts = 0;
        let accFaces = 0;
        for (let lineset of lines) {
            for (let i = 0; i < lineset.verts.count(); i++) {
                verts.slice().setRow(accVerts + i, lineset.verts.getRow(i));
            }
            for (let i = 0; i < lineset.links.length; i++) {
                ids[accFaces + i] = lineset.links[i] + accVerts;
            }
            accVerts += lineset.verts.count();
            accFaces += lineset.links.length;
        }

        return new MultiLine(verts, ids);
    }
}

// just get an int sequence from 0 to length.
export function getDefaultIndices(count: number): Uint16Array {
    let data = new Uint16Array(count);
    for (let i = 0; i < count; i++) {
        data[i] = i;
    }
    return data;
}

function getPairIndices(count: number, cyclic: boolean): Uint16Array {
    // given count of 3 => return 0,1 | 1,2 | 2,0
    let length = count * 2;
    if (!cyclic) {
        length -= 2;
    }
    let data = new Uint16Array(length);
    for (let i = 0; i < count; i++) {
        data[i * 2] = i;
        data[i * 2 + 1] = (i + 1) % count;
    }
    return data;
}
