// name: graph.ts
// author:  Jos Feenstra
// purpose: HalfEdge Mesh in 3D.
// This does mean that the order around a vertex is not staight forward, and must be handled using normals.

// TODO
// - graph clean
// - graph delete vert
// - to line renderable
// - keep track of faces, for quick meshification
//   - THIS WILL SPEED UP 'GET ALL FACES THREMENDOUSLY, WHICH WILL SPEED UP SUBDIVISONS'
// - remove ambiguity of halfedges & edges
//   - fix the fact that we 'dont' realllly use halfedges, we consistently use pairs of two.
//   - aka, twins are implicit: 0 -> 1 & 1 -> 0 OR 21 -> 20 & 20 -> 21

import { HashTable } from "../data/hash-table";
import { IntMatrix } from "../data/int-matrix";
import { Plane } from "../geo/plane";
import { Const } from "../math/const";
import { Matrix4 } from "../math/matrix";
import { Vector3 } from "../math/vector";
import { Mesh } from "./mesh";
import { MeshType, ShaderMesh } from "./shader-mesh";

export type EdgeIndex = number;
export type VertIndex = number;

export type Vert = {
    pos: Vector3;
    normal: Vector3;
    edge: EdgeIndex;
    dead: boolean;
};

export type Edge = {
    next: EdgeIndex;
    twin: EdgeIndex;
    vert: VertIndex;
    dead: boolean;
};

// FACES MUST BE CONVEX, OR BUGS MIGHT OCCUR!!!!
// interface Face {
//    edge: EdgeIndex,
// }

// NOTE: create an interface which hides the Edge, Vert & Face interfaces.
// NOTE: half edge is implied
export class Graph {
    verts: Vert[]; // TODO: SUPPORT REMOVAL (DEAL WITH UNEVEN MOVEMENTS IN THE LIST)
    edges: Edge[]; // NOTE: ALWAYS AN EVEN NUMBER OF EDGES. EDGE TWIN IS EVEN / UNEVEN MATCH

    constructor() {
        this.verts = [];
        this.edges = [];
    }

    static new() {
        return new Graph();
    }

    static fromMesh(mesh: Mesh): Graph {
        let graph = Graph.new();
        let normals = mesh.calculateVertexNormals();

        mesh.verts.forEach((v, i) => {
            graph.addVert(v, normals[i]);
        });

        let type = mesh.getType();
        if (type == MeshType.Invalid || type == MeshType.Points) {
            return graph;
        }

        let map = new HashTable<Boolean>();
        let width = mesh.links._width;
        mesh.links.forEachRow((row, i) => {
            // go through pairs
            // NOTE: this can be done way easier by creating 1 half edge per pair
            for (let i = 0; i < width; i++) {
                let iNext = (i + 1) % width;

                let a = row[i];
                let b = row[iNext];

                // console.log(a, b);
                if (a == -1 || b == -1) continue;
                graph.addEdgeIfNew(a, b);

                // let normal = normals[a].add(normals[b]).normalize();

                // if (map.has([a, b])) {
                //     console.log("GOT IT ALREADY")
                //     continue;
                // }
                // graph.addEdgeWithCustomNormal(a, b, normal);
                // map.set([b, a], true);
                // graph.addEdge(a, b);
            }
        });

        return graph;
    }

    // geometry trait

    clone() {
        throw new Error("not yet implemented...");
    }

    transform(matrix: Matrix4) {
        for (let i = 0; i < this.verts.length; i++) {
            let v = this.verts[i];
            v.pos = matrix.multiplyVector(v.pos);
        }
    }

    // UTILITY

    print() {
        console.log("graph");
        console.log("--------");
        console.log(`${this.verts.length} verts: `);
        for (let i = 0; i < this.verts.length; i++) {
            let v = this.verts[i];
            console.log(
                `v(${i}) | edge: ${
                    v.edge
                }, data: ${v.pos.toString()} normal: ${v.normal.toString()}`,
            );
        }

        console.log("--------");
        console.log(`${this.edges.length} edges:  `);
        for (let i = 0; i < this.edges.length; i++) {
            let e = this.edges[i];
            console.log(
                `e(${i}) | vert: ${e.vert}, twin: ${e.twin}, next: ${e.next}, dead ${e.dead}`,
            );
        }
        console.log("--------");
    }

    // CONVERTERS

    toMesh(): Mesh {
        return Mesh.fromGraph(this);
    }

    toLines(): Mesh {
        return Mesh.newLines(this.allVertPositions(), this.allUniqueEdgeVerts());
    }

    toShaderMesh(): ShaderMesh {
        return ShaderMesh.fromGraph(this);
    }

    // public getters

    allNorms(): Vector3[] {
        let data: Vector3[] = [];
        this.verts.forEach((v) => {
            data.push(v.normal);
        });
        return data;
    }

    allVertPositions(): Vector3[] {
        let data: Vector3[] = [];
        this.verts.forEach((v) => {
            data.push(v.pos);
        });
        return data;
    }

    allUniqueEdges(): EdgeIndex[] {
        let edges: EdgeIndex[] = [];
        let count = this.edges.length / 2;
        for (let i = 0; i < count; i++) {
            let i1 = i * 2;
            let i2 = i * 2 + 1;
            let a = this.getEdge(i1);
            let b = this.getEdge(i2);
            if (a.dead || b.dead) {
                continue;
            }
            edges.push(i1);
        }
        return edges;
    }

    allUniqueEdgeVerts(): VertIndex[] {
        let edges: VertIndex[] = [];
        let count = this.edges.length / 2;
        for (let i = 0; i < count; i++) {
            let i1 = i * 2;
            let i2 = i * 2 + 1;
            let a = this.getEdge(i1);
            let b = this.getEdge(i2);
            if (a.dead || b.dead) {
                continue;
            }
            edges.push(a.vert, b.vert);
        }
        return edges;
    }

    allEdgeVerts(): VertIndex[] {
        let data: VertIndex[] = [];
        // let edges = new Map<number, number>()
        this.edges.forEach((e, i) => {
            if (e.dead) return;
            let a = e.vert;
            let b = this.getEdge(e.twin).vert;

            if (a < b) {
                data.push(a);
                data.push(b);
            }
        });
        return data;
    }

    allVertLoops(): IntMatrix {
        throw "TODO";
    }

    allVertLoopsAsInts(): VertIndex[][] {
        // TODO speed this up
        let loops: VertIndex[][] = [];
        let unvisited = new Set<number>();
        this.edges.forEach((e, i) => {
            if (e.dead) {
                return;
            }
            unvisited.add(i);
        });

        let i = 0;
        const limit = this.edges.length; // we will never visit an edge twice if all is according to plan

        while (unvisited.size > 0) {
            let loop: VertIndex[] = [];
            let ei = unvisited.entries().next().value[0] as EdgeIndex;
            let start = ei;
            do {
                if (i > limit) {
                    // this.print();
                    throw "topology is corrupt!";
                }
                i += 1;
                let e = this.getEdge(ei);
                unvisited.delete(ei);
                loop.push(e.vert);
                ei = e.next;
            } while (ei != start);

            loops.push(loop);
        }
        return loops;
    }

    getLoop(ei: EdgeIndex): EdgeIndex[] {
        let loop: EdgeIndex[] = [];
        let i = 0;
        const limit = this.edges.length;
        let start = ei;
        do {
            if (i > limit) {
                // this.print();
                throw "topology is corrupt!";
            }
            i += 1;

            let e = this.getEdge(ei);
            loop.push(ei);
            ei = e.next;
        } while (ei != start);

        return loop;
    }

    getVertexPos(vi: VertIndex): Vector3 {
        if (vi < 0 || vi >= this.verts.length) {
            throw "out of range";
        }
        return this.verts[vi].pos;
    }

    getVertexNormal(vi: VertIndex): Vector3 {
        if (vi < 0 || vi >= this.verts.length) {
            throw "out of range";
        }
        return this.verts[vi].normal;
    }

    getVertexCount(): number {
        return this.verts.length;
    }

    getHalfEdgeCount(): number {
        return this.edges.length;
    }

    changeVertex(vi: VertIndex, pos: Vector3, norm: Vector3) {
        let v = this.verts[vi];
        v.pos = pos;
        v.normal = norm;
    }

    getVert(vi: VertIndex): Vert {
        if (vi < 0 || vi >= this.verts.length) {
            throw "out of range";
        }
        return this.verts[vi];
    }

    getEdge(ei: EdgeIndex): Edge {
        if (ei < 0 || ei >= this.edges.length) {
            console.error("out of range");
        }
        return this.edges[ei];
    }

    getEdgeIndexBetween(ai: VertIndex, bi: VertIndex): EdgeIndex | undefined {
        let res = this.getEdgeBetween(ai, bi);
        if (res) return this.getEdgeIndex(res);
        return undefined;
    }

    getEdgeBetween(ai: VertIndex, bi: VertIndex): Edge | undefined {
        let edges = this.getVertEdgeFan(ai);
        for (let i = 0; i < edges.length; i++) {
            if (this.getEdge(edges[i].twin).vert == bi) {
                return edges[i];
            }
        }

        return undefined;
    }

    getVertEdgeFan(vi: VertIndex): Edge[] {
        // get all edges connected to this vertex.
        // NOTE: all are outgoing (e.vert == vi)

        // console.log("getting fan");

        let fan: Edge[] = [];
        let v = this.verts[vi];
        let ei = v.edge;
        let start = ei;
        if (ei == -1) {
            return fan;
        }
        let count = 0;
        while (true) {
            if (count > this.verts.length) {
                this.print();
                console.log("fan: ", fan);
                throw "nope";
            }
            count += 1;

            // console.log("step", count, "ei", ei);

            let e = this.getEdge(ei);
            let e_twin = this.getEdgeTwin(ei);
            fan.push(e);

            ei = e_twin.next;

            if (ei == start) {
                break;
            }
        }

        // console.log("returning fan: ", fan);
        return fan;
    }

    getLoopsAdjacentToEdge(ei: EdgeIndex): EdgeIndex[][] {
        let loops: EdgeIndex[][] = [];

        loops.push(this.getLoop(ei));
        loops.push(this.getLoop(this.getEdge(ei).twin));

        return loops;
    }

    getVertNeighbors(vi: VertIndex): VertIndex[] {
        let ids: VertIndex[] = [];
        this.getVertEdgeFan(vi).forEach((e: Edge) => {
            ids.push(this.getEdge(e.twin).vert);
        });
        return ids;
    }

    getEdgeIndex(e: Edge) {
        return this.getEdge(e.twin).twin;
    }

    getEdgeTwin(ei: EdgeIndex): Edge {
        return this.edges[this.edges[ei].twin];
    }

    hasEdge(a: VertIndex, b: VertIndex) {
        let nbs = this.getVertNeighbors(a);
        return nbs.includes(b);
    }

    addVert(vector: Vector3, normal: Vector3): VertIndex {
        this.verts.push({ pos: vector, edge: -1, normal: normal, dead: false });
        return this.verts.length - 1;
    }

    removeVert(a: VertIndex) {
        throw "TODO FIGURE OUT NULL & REMOVAL";
    }

    addEdgeIfNew(a: VertIndex, b: VertIndex): boolean {
        if (!this.hasEdge(a, b)) {
            // console.log("not there!");
            this.addEdge(a, b);
            return true;
        }
        return false;
    }

    addEdge(vi_1: VertIndex, vi_2: VertIndex) {
        //             ei1
        // / vi1 \  ---------> / vi2 \
        // \     / <---------  \     /
        //             ei2

        let ei_1 = this.edges.length;
        let ei_2 = ei_1 + 1;

        this.edges.push({
            next: -1,
            twin: ei_2,
            vert: vi_1,
            dead: false,
        });
        this.edges.push({
            next: -1,
            twin: ei_1,
            vert: vi_2,
            dead: false,
        });

        // make sure the 'next' things are fixed, and more
        this.addEdgeToDisk(vi_1, ei_1);
        this.addEdgeToDisk(vi_2, ei_2);
    }

    deleteEdgeByIndex(id: EdgeIndex) {
        // flag it as 'to be removed'
        this.deleteEdge(this.getEdge(id));
    }

    deleteEdge(edge: Edge) {
        // flag it as 'to be removed'
        let twin = this.getEdge(edge.twin);
        edge.dead = true;
        twin.dead = true;

        // remove all pointers
        this.deleteEdgeFromDisk(edge);
        this.deleteEdgeFromDisk(twin);
    }

    // SETTERS

    getDiskPositions(ei: EdgeIndex): [EdgeIndex, EdgeIndex] {
        // returns edgeIndex before, edgeIndex after
        let e = this.getEdge(ei);
        let v = this.getVert(e.vert)!;
        let twin = this.getEdgeTwin(ei);
        let v_twin = this.verts[twin.vert];
        let myVector = v.pos.subbed(v_twin.pos);

        // get all vectors
        let vectors: Vector3[] = [];
        vectors.push(myVector);

        // get more vectors by getting all edges currently connected to vertex v

        // if this Edge is already within the fan, filter it out, so this assessment can be correctly made
        let edgesPotentiallyWithExistingEdge = this.getVertEdgeFan(e.vert);
        let edges: Edge[] = [];
        for (let i = 0; i < edgesPotentiallyWithExistingEdge.length; i++) {
            let edge = edgesPotentiallyWithExistingEdge[i];
            if (this.getEdgeIndex(edge) == ei) {
                // console.log("edge is in the fan!");
            } else {
                edges.push(edge);
            }
        }

        if (edges.length == 0) {
            return [ei, ei];
        }

        if (edges.length == 1) {
            let e = edges[0];
            return [this.getEdgeIndex(e), this.getEdgeIndex(e)];
        }

        // console.log("edges", edges);

        for (let i = 0; i < edges.length; i++) {
            let edge = edges[i];
            let twin = this.getEdge(edge.twin);
            let neighbor = this.verts[twin.vert];
            let neighborVector = v.pos.subbed(neighbor.pos);
            vectors.push(neighborVector);
        }

        // console.log("all vectors: ", vectors);

        // order them by 'wheel'
        let plane = Plane.fromPN(v.pos, v.normal);
        let ihat = plane.ihat;
        let jhat = plane.jhat;
        let order = Vector3.calculateWheelOrder(vectors, ihat, jhat);

        // console.log("order", order);

        // find index 0 in the ordering. that is the position of this new edge. get the edges before and after this edge
        let i_before = -1;
        let i_after = -1;
        for (let a = 0; a < order.length; a++) {
            let b = (a + 1) % order.length;
            let c = (a + 2) % order.length;
            if (order[b] == 0) {
                i_before = order[a];
                i_after = order[c];
                break;
            }
        }

        // pick. NOTE: IF CCW / CC OF GRAPH NEEDS TO BE CHANGED, CHANGE THIS ORDER, BUT USE WITH CAUTION
        // minus one, since we have 1 vector more than the edge list
        let e_before = edges[i_after - 1];
        let e_after = edges[i_before - 1];

        return [this.getEdgeIndex(e_before), this.getEdgeIndex(e_after)];
    }

    addEdgeToDisk(vi: VertIndex, ei: EdgeIndex) {
        let v = this.getVert(vi)!;
        let twin = this.getEdgeTwin(ei);
        if (v.edge == -1) {
            // set two pointers:
            v.edge = ei; // I am the vertex's first edge
            twin.next = ei; // that means my twin points back to me
        } else {
            let [ei_before, ei_after] = this.getDiskPositions(ei);
            let [e_before, e_after] = [this.getEdge(ei_before), this.getEdge(ei_after)];

            // set two pointers:
            this.getEdge(e_before.twin).next = ei;
            twin.next = this.getEdgeIndex(e_after);
        }
    }

    deleteEdgeFromDisk(edge: Edge) {
        let ei = this.getEdgeIndex(edge);
        // console.log("deleting...", ei);

        let vert = this.getVert(edge.vert);

        // console.log("deleting from disk...");
        let [ei_before, ei_after] = this.getDiskPositions(ei);

        if (ei_before == ei) {
            vert.edge = -1;
            return;
        }

        // let flower = this.getVertEdgeFan(edge.vert);
        // flower.forEach((e) => {console.log(this.getEdgeIndex(e))});
        let [e_before, e_after] = [this.getEdge(ei_before), this.getEdge(ei_after)];

        // set one pointer
        // console.log("this is edge", ei);

        // // console.log("before is", ei_before);
        // console.log("after is", ei_after);

        // console.log("before.twin.next is", this.getEdge(e_before.twin).next);
        // console.log("after.twin.next is", this.getEdge(e_after.twin).next);
        this.getEdge(e_before.twin).next = ei_after;

        if (vert.edge == ei) {
            vert.edge = ei_after;
        }
    }

    // MISC

    splitEdge(ai: VertIndex, bi: VertIndex, alpha: number): VertIndex {
        // get the edge
        let edge = this.getEdgeBetween(ai, bi);
        if (!edge) throw new Error(`No Edge found between ${ai} and ${bi}`);
        let twin = this.getEdge(edge.twin);

        let a = this.getVert(ai);
        let b = this.getVert(bi);
        let v = Vector3.fromLerp(a.pos, b.pos, alpha);
        let n = Vector3.fromLerp(a.normal, b.normal, alpha);

        let ci = this.addVert(v, n);
        let c = this.getVert(ci);

        // change the edges
        // if (ai == 0) {

        // }

        this.deleteEdge(edge);
        this.addEdge(ai, ci);
        this.addEdge(ci, bi);

        return ci;
    }

    subdivide() {
        // 1. get all edges
        let edges = this.allEdgeVerts();
        let faces = this.allVertLoopsAsInts();

        // this maps old edges to new vertices
        let deadEdgeMap = new HashTable<VertIndex>(); // this

        // 2. split all edges, map
        let count = edges.length / 2;
        let middlePoints = new Array<VertIndex>(count);
        for (let i = 0; i < count; i++) {
            let vai = edges[i * 2];
            let vbi = edges[i * 2 + 1];

            // let edgeI = this.getEdgeIndexBetween(vai, vbi)!;
            // let edgeII = this.getEdgeIndexBetween(vbi, vai)!;

            let vci = this.splitEdge(vai, vbi, 0.5);
            middlePoints[i] = vci;
            deadEdgeMap.set([vai, vbi], vci);
            deadEdgeMap.set([vbi, vai], vci);
        }

        // 3. per old face: connect the dots
        for (let i = 0; i < faces.length; i++) {
            let face = faces[i];

            // get all middle points
            let middlePoints = new Array<VertIndex>(face.length);
            for (let j = 0; j < face.length; j++) {
                let jNext = (j + 1) % face.length;
                let via = face[j];
                let vib = face[jNext];
                // console.log(via, vib);
                middlePoints[j] = deadEdgeMap.get([via, vib])!;
            }

            // console.log(middlePoints);

            // connect the dots
            for (let j = 0; j < face.length; j++) {
                let jNext = (j + 1) % face.length;
                this.addEdge(middlePoints[j], middlePoints[jNext]);
            }
        }
    }

    subdivideQuad() {
        // 1. get all edges
        let edges = this.allEdgeVerts();
        let faces = this.allVertLoopsAsInts();

        // this maps old edges to new vertices
        let deadEdgeMap = new HashTable<VertIndex>(); // this

        // 2. split all edges, map
        let count = edges.length / 2;
        for (let i = 0; i < count; i++) {
            let vai = edges[i * 2];
            let vbi = edges[i * 2 + 1];

            // let edgeI = this.getEdgeIndexBetween(vai, vbi)!;
            // let edgeII = this.getEdgeIndexBetween(vbi, vai)!;

            let vci = this.splitEdge(vai, vbi, 0.5);
            deadEdgeMap.set([vai, vbi], vci);
            deadEdgeMap.set([vbi, vai], vci);
        }

        // 3. per old face: connect the dots
        for (let i = 0; i < faces.length; i++) {
            let face = faces[i];

            // get center point
            let pos = Vector3.zero();
            for (let j = 0; j < face.length; j++) {
                pos.add(this.getVertexPos(face[j]));
            }
            pos.scale(1 / face.length);

            let norm = calcPlanarFaceNormal(face.map((v) => this.getVertexPos(v)));
            let si = this.addVert(pos, norm);

            // per middle point, connect the dots
            for (let j = 0; j < face.length; j++) {
                let jNext = (j + 1) % face.length;
                let via = face[j];
                let vib = face[jNext];
                // console.log(via, vib);
                let c = deadEdgeMap.get([via, vib])!;
                this.addEdge(si, c);
            }
        }
    }

    forEveryEdgeVerts(callback: (a: Vector3, b: Vector3) => void) {
        let edges = this.allUniqueEdgeVerts();
        let edgeCount = edges.length / 2;
        for (let i = 0; i < edgeCount; i++) {
            let a = this.getVert(edges[i * 2]);
            let b = this.getVert(edges[i * 2 + 1]);
            callback(a.pos, b.pos);
        }
    }
}

function calcPlanarFaceNormal(face: Vector3[]): Vector3 {
    // ASSUMES : FACE = PLANAR & FACE = NOT SLIVER POLYGON (AREA > 0)
    let count = face.length;
    if (count < 3) {
        throw "cannot get face planar with 2 or less edges";
    }

    // get the normal of a planar face
    let normal = Vector3.zero();

    // two edges could be parallel, but there will be two edges in the face that are different.
    let ihat = face[1].subbed(face[0]);
    let jhat = face[2].subbed(face[1]);

    for (let i = 1; i < count; i++) {
        if (Math.abs(ihat.dot(jhat)) > Const.TOLERANCE) {
            return ihat.cross(jhat);
        } else {
            // try again with next pair of
            let i2 = (i + 1) % count;
            let i3 = (i + 2) % count;
            jhat = face[i3].subbed(face[i2]);
        }
    }
    throw "get planar face failed...";
}
