// TODO: to select triangles (or quads), use this beautiful thing

import { Mesh } from "../mesh/mesh";

export class MeshPickShader {
    constructor() {}

    pickMesh(meshes: Mesh[]): number {
        return 0;
    }

    // process to discover which mesh is picked out of a list of meshes
    // DO THIS ONE FIRST. YOU CAN JUST SPLIT UP A MESH INTO SEVERAL MINI-MESHES TO SOLVE THIS PROBLEM QUICK AND DIRTY
}
