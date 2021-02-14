import { getBinaryCache } from "@tensorflow/tfjs-backend-webgl/dist/backend_webgl";
import { HashTable } from "../data/hash-table";
import { IntMatrix } from "../data/int-matrix";
import { Vector2, Vector3 } from "../math/vector";
import { Mesh } from "./mesh";

// a mesh with topological information
export class TopoMesh extends Mesh {

    lastTouched = 0; // needed for triangle walk
    neighborMap: IntMatrix;

    // private -> should only be used with factory methods
    private constructor(vertCount: number, normCount: number, uvCount: number, faceCount: number, texture: ImageData | undefined = undefined) {
        super(vertCount, normCount, uvCount, faceCount, texture);
        this.neighborMap = new IntMatrix(this.faces.count(), 3);
    }

    static copyFromMesh(mesh: Mesh) : TopoMesh {
        let topoMesh = new TopoMesh(mesh.verts.count(), mesh.norms.count(), mesh.uvs.count(), mesh.faces.count());
        topoMesh.verts = mesh.verts.clone();
        topoMesh.norms = mesh.norms.clone();
        topoMesh.uvs = mesh.uvs.clone();
        topoMesh.faces = mesh.faces.clone();
        topoMesh.setNeighborMap();
        return topoMesh;
    }

    setNeighborMap() {

        // this method fills this.neighborMap after data is loaded

        // 
        let edges = new HashTable<[boolean, number, number]>();
        let pairs = new HashTable<any>();

        // 1 | per triangle
        this.faces.forEachRow((f, faceIndex) => {
            let faceEdges = [
                [f[0], f[1]],
                [f[1], f[2]],
                [f[2], f[0]]
            ];
            faceEdges.forEach(e => {

                // if (4, 1), orientation is True | if (1, 4), orientation is False
                let orientation = e[0] > e[1]

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
                    if (orientation != nbOrientation)
                        pairs.set(pair, false);
                    else
                        pairs.set(pair, true);
                }
            });
        });

        // Done. Give feedback
        let count = 0;
        // for pair in pairs.items():
        //     if not pair: count +=1;
        console.log("number of 'wrong' face neighbours: ", count)
        return;
    }

    
    /**
     * @param  {Vector2} point
     * @returns triangleIndex, or -1 if failure
     */
    walkUV(point: Vector2) : number {

        // start where we last stopped
        let faceIndex = this.lastTouched;

        // make sure we never take more steps than triangles in the triangulation.
        // this would mean something went wrong
        
        let count = this.faces.count();
        for(let _ = 0 ; _ < count; _++) {

            // i dont know how, but if we accidentally landed outside of the mesh
            if (faceIndex == -1) {
                return -1;
            }

            for(let i = 0 ; i < 3; i++) {
                let j = (i + 1) % 3;

                let face = this.faces.getRow(faceIndex);
                let edge: [number, number] = [face[i], face[j]];
                let sign = this.pointSignUV(point, edge);

                if (sign < 0) {
                    faceIndex = this.getNb(faceIndex, edge);

                    // if its ouside, return -1
                    if (faceIndex == -1) 
                        return -1;

                    // else: go there immidiately
                    this.lastTouched = faceIndex;
                    break;
                }

                // if this ran 3 times, the point must be within the triangle
                if (i == 2) 
                    return faceIndex;
            }
        }

        // something went wrong
        return -1;
    }

    elevate(p: Vector2) : Vector3 {
        // 'elevate' a point in UV space to vertex space using a barycentric remap
        
        // figure out where this point is located on the mesh
        let tr = this.walkUV(p);
        
        if (tr == -1) {
            console.warn("got a point not on triangle...");
            return new Vector3(0,0,0);
        } 

        let bari = this.getBariCoords(tr, p, true);
        let point3d = this.getBariPoint(tr, bari, false) as Vector3;

        return point3d;
    }

    flatten(p: Vector3) : Vector2 {
        // 'flatten' a point in vertex space to uv space using a barycentric remap
        return new Vector2(0,0);
    }

    private pointSignUV(a: Vector2, edge: [number, number]) {

        let b = this.uvs.getVector(edge[0]);
        let c = this.uvs.getVector(edge[1]);

        return ((a.x - c.x) * (b.y - c.y)) - ((b.x - c.x) * (a.y- c.y));
    }

    private setNb(faceIndex: number, commonEdge: Int32Array, nbIndex: number) {
        
        for(let j = 0 ; j < 3; j++) {
            if (!commonEdge.includes(this.faces.get(faceIndex, j))) {
                this.neighborMap.set(faceIndex, j, nbIndex);
                return;
            } 
        }
        console.log(this.faces.getRow(faceIndex));
        console.log(commonEdge);
        throw "these are not actually neighbors!";
    }

    private getNb(faceIndex: number, commonEdge: Int32Array | [number, number] ) : number {
        for(let j = 0 ; j < 3; j++) {
            if (!commonEdge.includes(this.faces.get(faceIndex, j))) {
                return this.neighborMap.get(faceIndex, j);
            } 
        }
        console.log(this.faces.getRow(faceIndex));
        console.log(commonEdge);
        throw "common edge does not match triangle index!";
    }

    private getFacePoints(tr: number, uv=true) : [any, any, any] {
        
        let pointIds = this.faces.getRow(tr);
        if (uv) {
            return [
                this.uvs.getVector(pointIds[0]),
                this.uvs.getVector(pointIds[1]),
                this.uvs.getVector(pointIds[2]),
            ];
        } else {
            return [
                this.verts.getVector(pointIds[0]),
                this.verts.getVector(pointIds[1]),
                this.verts.getVector(pointIds[2]),
            ]
        }
        
    }

    private getBariCoords(faceIndex: number, p: Vector2, fromUV: boolean) : Vector3 {
        // get vectors
        let [a, b, c] = this.getFacePoints(faceIndex, fromUV);

        // this can be more elegant using matrices, but this formula works
        let [px, py] = [p.x, p.y];
        let [x1, y1] = [a.x, a.y];
        let [x2, y2] = [b.x, b.y];
        let [x3, y3] = [c.x, c.y];
        let denom = ((y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3))
        let u = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denom
        let v = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denom
        let w = 1 - u - v
        return new Vector3(u, v, w);
    }

    private getBariPoint(faceIndex: number, barycoord: Vector3, fromUV: boolean) : Vector2 | Vector3 {
        let [a, b, c] = this.getFacePoints(faceIndex, fromUV);

        a.scale(barycoord.x);
        b.scale(barycoord.y);
        c.scale(barycoord.z);

        return a.add(b).add(c);

    }
}