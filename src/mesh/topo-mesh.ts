import {
    IntMatrix,
    HashTable,
    Vector2,
    Vector3,
    MultiVector3,
    Triangle2,
    Triangle3,
    ShaderMesh,
} from "../lib";

// a mesh with topological information
export class TopoMesh extends ShaderMesh {
    lastTouched = 0; // needed for triangle walk
    neighborMap: IntMatrix;

    // private -> should only be used with factory methods
    private constructor(
        vertCount: number,
        normCount: number,
        uvCount: number,
        faceCount: number,
        texture: ImageData | undefined = undefined,
    ) {
        super(vertCount, normCount, uvCount, faceCount, texture);
        this.neighborMap = new IntMatrix(this.mesh.links.count(), 3);
    }

    static copyFromShaderMesh(rend: ShaderMesh): TopoMesh {
        let topoMesh = new TopoMesh(
            rend.mesh.verts.count,
            rend.norms.count,
            rend.uvs.count,
            rend.mesh.links.count(),
        );
        topoMesh.mesh.verts = rend.mesh.verts.clone();
        topoMesh.norms = rend.norms.clone();
        topoMesh.uvs = rend.uvs.clone();
        topoMesh.mesh.links = rend.mesh.links.clone();
        topoMesh.setNeighborMap();
        return topoMesh;
    }

    setNeighborMap() {
        // this method fills this.neighborMap after data is loaded

        //
        let edges = new HashTable<[boolean, number, number]>();
        let pairs = new HashTable<any>();

        // 1 | per triangle
        this.mesh.links.forEachRow((f, faceIndex) => {
            let faceEdges = [
                [f[0], f[1]],
                [f[1], f[2]],
                [f[2], f[0]],
            ];
            faceEdges.forEach((e) => {
                // if (4, 1), orientation is True | if (1, 4), orientation is False
                let orientation = e[0] > e[1];

                // use this min max construction to only store one edge per triangle pair
                // let edge: [number, number] = e.sort();
                let edge = new Int32Array([Math.min(...e), Math.max(...e)]);
                // console.log(edge);

                if (!edges.has(edge)) {
                    // orientation, first tr ID, second tr ID
                    edges.set(edge, [orientation, faceIndex, -1]);
                } else {
                    // an edge match is made!
                    // console.log("matched!");
                    let other = edges.get(edge)!;
                    let nbOrientation = other[0];
                    let nbIndex = other[1];
                    other[2] = faceIndex;
                    edges.set(edge, other); // edge is put away again, if an edge map is ever needed.

                    // assign neighbours
                    this.setNb(faceIndex, edge, nbIndex);
                    this.setNb(nbIndex, edge, faceIndex);

                    // use this info to fill self.pairs
                    // if orientation != other orientation, edge is 'good' -> False
                    // else -> True, one of the neighbour triangles needs to be flipped
                    let pair = [nbIndex, faceIndex];
                    pair.sort();
                    // pair = (Math.min(...pair), Math.max(...pair))
                    if (orientation != nbOrientation) pairs.set(pair, false);
                    else pairs.set(pair, true);
                }
            });
        });

        // Done. Give feedback
        let count = 0;
        // for pair in pairs.items():
        //     if not pair: count +=1;
        console.log("number of 'wrong' face neighbours: ", count);
        return;
    }

    /**
     * Get the triangle based on a UV point somewhere on the mesh.
     * Returns -1 if the point is not on the mesh TODO OR IF THE PATH HAS HOLES IN IT TODO FIX THIS!
     * @param  {Vector2} point
     * @returns triangleIndex, or -1 if failure
     */
    walkUV(point: Vector2): number {
        // start where we last stopped
        let faceIndex = this.lastTouched;

        // make sure we never take more steps than triangles in the triangulation.
        // this would mean something went wrong

        let count = this.mesh.links.count();
        for (let _ = 0; _ < count; _++) {
            // i dont know how, but if we accidentally landed outside of the mesh
            if (faceIndex == -1) {
                return -1;
            }

            for (let i = 0; i < 3; i++) {
                let j = (i + 1) % 3;

                let face = this.mesh.links.getRow(faceIndex);
                let edge: [number, number] = [face[i], face[j]];

                let b = this.uvs.get(edge[0]);
                let c = this.uvs.get(edge[1]);

                let sign = point.sign(b, c);

                if (sign < 0) {
                    faceIndex = this.getNb(faceIndex, edge);

                    // if its ouside, return -1
                    if (faceIndex == -1) return -1;

                    // else: go there immidiately
                    this.lastTouched = faceIndex;
                    break;
                }

                // if this ran 3 times, the point must be within the triangle
                if (i == 2) return faceIndex;
            }
        }

        // something went wrong
        return -1;
    }

    // find the faces closest to the point
    // -1 if the mesh does not contain triangles
    closestFaces(point: Vector3): number[] {
        let closestVertexId = this.mesh.verts.closestId(point);
        // get all face ids containing closestVertex, along with their centers
        let closestFaces: number[] = [];
        //let centers: Vector3[] = []
        this.mesh.links.forEachRow((tr, i) => {
            if (tr.includes(closestVertexId)) {
                closestFaces.push(i);
                //let center = Vector3Array.fromList(this.getFacePoints(i, false)).average();
                //centers.push(center);
            }
        });

        // select the triangle with the closest baricenter
        return closestFaces;
    }

    elevate(p: Vector2): Vector3 {
        // 'elevate' a point in UV space to vertex space using a barycentric remap
        // figure out where this point is located on the mesh
        let face = this.walkUV(p);

        if (face == -1) {
            console.warn("got a point not on triangle...");
            return new Vector3(0, 0, 0);
        }

        let tr3 = this.getTriangle3(face);
        let tr2 = this.getTriangle2(face);

        let bari = tr2.toBarycentric(p);
        return tr3.fromBarycentric(bari);
    }

    closestFace(p: Vector3): number {
        // NOTE this doesnt really work all that well...
        let faceIds = this.closestFaces(p);
        let closestPoints = MultiVector3.new(faceIds.length);
        faceIds.forEach((id, i) => {
            let tr = this.getTriangle3(id);
            let cp = tr.closestPoint(p);
            closestPoints.set(i, cp);
        });

        // find the closest closest point
        let id = closestPoints.closestId(p);
        return faceIds[id];
    }

    // 'flatten' a point in vertex space to uv space using a barycentric remap
    // NOTE : this is not exactly a 'project to closest triangle', something like that wouldnt always work
    flatten(p: Vector3, face: number): Vector2 {
        let tr3 = this.getTriangle3(face);
        let tr2 = this.getTriangle2(face);

        let bari = tr3.toBarycentric(p);
        return tr2.fromBarycentric(bari);
    }

    // combo
    flattenClosestPoint(p: Vector3) {
        let face = this.closestFace(p);
        return this.flatten(p, face);
    }

    closestPoint(p: Vector3) {
        let face = this.closestFace(p);
        let triangle = this.getTriangle3(face);
        let bari = triangle.toBarycentric(p);
        return triangle.fromBarycentric(bari);
    }

    public getTriangle2(id: number): Triangle2 {
        let p = this.getFacePoints(id, true);
        return new Triangle2(p[0], p[1], p[2]);
    }

    public getTriangle3(id: number): Triangle3 {
        let p = this.getFacePoints(id, false);
        return new Triangle3(p[0], p[1], p[2]);
    }

    private setNb(faceIndex: number, commonEdge: Int32Array, nbIndex: number) {
        for (let j = 0; j < 3; j++) {
            if (!commonEdge.includes(this.mesh.links.get(faceIndex, j))) {
                this.neighborMap.set(faceIndex, j, nbIndex);
                return;
            }
        }
        console.log(this.mesh.links.getRow(faceIndex));
        console.log(commonEdge);
        throw "these are not actually neighbors!";
    }

    private getNb(faceIndex: number, commonEdge: Int32Array | [number, number]): number {
        for (let j = 0; j < 3; j++) {
            if (!commonEdge.includes(this.mesh.links.get(faceIndex, j))) {
                return this.neighborMap.get(faceIndex, j);
            }
        }
        console.log(this.mesh.links.getRow(faceIndex));
        console.log(commonEdge);
        throw "common edge does not match triangle index!";
    }

    private getFacePoints(tr: number, uv: boolean): [any, any, any] {
        let pointIds = this.mesh.links.getRow(tr);
        if (uv) {
            return [
                this.uvs.get(pointIds[0]),
                this.uvs.get(pointIds[1]),
                this.uvs.get(pointIds[2]),
            ];
        } else {
            return [
                this.mesh.verts.get(pointIds[0]),
                this.mesh.verts.get(pointIds[1]),
                this.mesh.verts.get(pointIds[2]),
            ];
        }
    }
}
