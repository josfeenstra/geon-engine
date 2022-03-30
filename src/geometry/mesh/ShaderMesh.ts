// Name: render-mesh.ts
// Author: Jos Feenstra
// Purpose:
// a mesh representation which can be feed to a shader.
// - fixed length attributes
// - can represent:
//   - pointcloud (links = null)
//   - graph (links.width = 2)
//   - triangles (links.width = 3)
//   - quads (links.width = 4. will need to be converted to triangles for now...)

// NOTE : THIS WHOLE CLASS CAN BE DELETED. ALL FUNCTIONALITY HAS BEEN TRANSFERED TO MESH + MODEL + ENTITY ABSTRACTIONS

import {
    Domain2,
    Bitmap,
    Graph,
    HelpGl,
    Matrix4,
    Mesh,
    MeshType,
    MultiVector2,
    MultiVector3,
    NormalKind,
    Plane,
    quadToTri,
    Rectangle3,
    Vector3,
} from "../../lib";
import { Shadable } from "../../render/basics/Shadable";

type vertexID = number;
type faceID = number;

export class ShaderMesh {
    // this desperately calls for an overhaul...

    mesh: Mesh;
    ambi: Float32Array;
    texture?: TexImageSource;
    _normKind: NormalKind = NormalKind.None;

    position: Matrix4;

    // render speed
    // shader
    color = [1, 1, 1, 1];
    linecolor = [1, 1, 1, 1];

    constructor(
        vertCount: number,
        normCount: number,
        uvCount: number,
        faceCount: number,
        texture: TexImageSource | undefined = undefined,
    ) {
        let perFaceCount = 3;
        this.mesh = Mesh.newEmpty(vertCount, faceCount, perFaceCount);
        this.norms = MultiVector3.new(normCount);
        this.uvs = MultiVector2.new(uvCount);
        this.ambi = new Float32Array(vertCount);
        this.texture = texture;
        this.position = Matrix4.newIdentity();
    }

    set norms(v: MultiVector3) {
        this.mesh.setNormals(v);
    }

    set uvs(v: MultiVector2) {
        this.mesh.setUvs(v, this._normKind);
    }

    get norms() {
        return this.mesh.normals!;
    }

    get uvs() {
        return this.mesh.uvs!;
    }

    static new(
        vertCount: number,
        normCount: number,
        uvCount: number,
        faceCount: number,
        texture: ImageData | undefined = undefined,
    ) {
        return new ShaderMesh(vertCount, normCount, uvCount, faceCount, texture);
    }

    static fromRectDoubleSided(rect: Rectangle3, texture?: ImageData) {
        let verts = rect.getCorners();
        let faces: number[] = [];
        faces.push(...[0, 1, 3, 0, 3, 2, 0, 3, 1, 0, 2, 3]);
        let rend = new ShaderMesh(4, 0, 0, 4, texture);
        rend.setUvs(
            new Float32Array([
                0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0,
            ]),
        );
        rend.mesh.verts.fillFromList(verts);
        rend.mesh.links.setData(faces);
        return rend;
    }

    static fromRect(rect: Rectangle3): ShaderMesh {
        let verts = rect.getCorners();
        let faces: number[] = [];
        faces.push(...quadToTri([0, 1, 3, 2]));
        let rend = new ShaderMesh(4, 0, 0, 2);
        rend.setUvs(new Float32Array([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]));
        rend.mesh.verts.fillFromList(verts);
        rend.mesh.links.setData(faces);
        return rend;
    }

    static fromImage(
        image: Bitmap | HTMLImageElement,
        plane: Plane,
        centered = true,
        scale = 1,
        fixWebglLimitation = true,
        bothSides = true,
    ): ShaderMesh {

        let domain;
        if (centered) {
            domain = Domain2.fromWH(
                (-image.width / 2) * scale,
                (-image.height / 2) * scale,
                image.width * scale,
                image.height * scale,
            );
        } else {
            domain = Domain2.fromWH(0, 0, image.width * scale, image.height * scale);
        }

        let rectangle = new Rectangle3(plane, domain);

        let mesh: ShaderMesh;
        if (bothSides) {
            mesh = ShaderMesh.fromRectDoubleSided(rectangle);
        } else {
            mesh = ShaderMesh.fromRect(rectangle);
        }

        // note: webgl can only work with 2^x images
        if (fixWebglLimitation && image instanceof Bitmap) {

            let goodWidth = HelpGl.getNearestCorrectTextureSize(image.width);
            let goodHeight = HelpGl.getNearestCorrectTextureSize(image.height);
            if (goodWidth !== image.width || goodHeight !== image.height) {
                // we need to perform resizing!
                // console.log("resizing to ", goodWidth, goodHeight);
                let u = image.width / goodWidth;
                let v = image.height / goodHeight;

                image = image.buffer(goodWidth, goodHeight);
                if (bothSides) {
                    // mesh.setUvs(new Float32Array([
                    //     0.0, 0.0,
                    //     0.0, v,
                    //     u, 0.0,
                    //     u, v,
                    //     0.0, 0.0,
                    //     u, 0.0,
                    //     0.0, v,
                    //     u, v
                    // ]));
                } else {
                    // mesh.setUvs(new Float32Array([
                    //     0.0, 0.0,
                    //     0.0, v,
                    //     u, 0.0,
                    //     u, v
                    // ]));
                }
            }
        }
        mesh.setTexture((image instanceof Bitmap) ? image.toImageData() : image);
        return mesh;
    }

    static fromMesh(mesh: Mesh): ShaderMesh {
        let r = new ShaderMesh(mesh.verts.count, 0, 0, mesh.maxSize);
        r.mesh = mesh;
        return r;
    }

    static fromData(verts: number[], norms: number[], uvs: number[], faces: number[]): ShaderMesh {
        // NOTE : this type of parsing makes my life easy, but is dangerous. This is why i created the
        // Array class.
        let r = new ShaderMesh(
            verts.length / 3,
            norms.length / 3,
            uvs.length / 2,
            faces.length / 3,
        );
        r.mesh.verts.slice().fillWith(verts);
        r.mesh.links!.fillWith(faces);
        r.norms!.slice().fillWith(norms);
        r.uvs = MultiVector2.fromData(uvs);

        return r;
    }

    static fromGraph(graph: Graph) {
        let mesh = graph.toMesh();
        let r = ShaderMesh.fromMesh(mesh);
        r.norms = MultiVector3.fromList(graph.allNorms());
        r._normKind = NormalKind.Vertex; // fix this!!
        return r;
    }

    // geometry trait

    transform(matrix: Matrix4) {
        for (let i = 0; i < this.mesh.verts.count; i++) {
            let v = this.mesh.verts.get(i);
            let n = this.norms.get(i);
            this.mesh.verts.set(i, matrix.multiplyVector(v));
            this.norms.set(i, matrix.multiplyVector(n)); // TODO, EXTRACT ONLY ROTATION PART FROM THE MATRIX
        }
    }

    // getters & selectors

    // VERY POORLY OPTIMIZED
    getAdjacentFaces(v: vertexID): faceID[] {
        let faces: faceID[] = [];
        let count = this.mesh.links.count();
        for (let i = 0; i < count; i++) {
            if (this.mesh.links.getRow(i).find((j) => j == v)) {
                faces.push(i);
            }
        }
        return faces;
    }

    getFaceVertices(f: faceID): MultiVector3 {
        return this.mesh.getVerticesOfFace(f);
    }

    getType(): MeshType {
        return this.mesh.getType();
    }

    getNormalType(): NormalKind {
        return this._normKind;
    }

    // setters

    setTexture(texture: TexImageSource) {
        this.texture = texture;
        // recalculate things if needed
    }

    setUvs(uvs: MultiVector2 | Float32Array) {
        if (uvs instanceof Float32Array) {
            this.uvs = MultiVector2.fromData(uvs);
        } else {
            this.uvs = uvs;
        }

        // recalculate if needed
    }

    // convert
    exportToObj(path: string) {
        throw "todo";
    }

    // ------ normals ------

    // set 1 normal per face
    calculateFaceNormals() {
        if (this.getType() != MeshType.Triangles) {
            console.error("can only calculate normals from triangular meshes");
            this.norms = MultiVector3.new(0);
            return;
        }
        let norms = this.mesh.OLDcalculateFaceNormals();
        this.norms = MultiVector3.fromList(norms);
        this._normKind = NormalKind.Face;
    }

    calculateVertexNormals() {
        let norms = this.mesh.OLDcalculateVertexNormals();
        this.norms = MultiVector3.fromList(norms);
        this._normKind = NormalKind.Vertex;
    }

    calculateMultiVertexNormals() {
        // set type
        this._normKind = NormalKind.MultiVertex;

        // calculate
        this.calculateFaceNormals();
        let vertNormals = this.mesh.verts.map((v, i) => {
            let adjFaces = this.getAdjacentFaces(i);
            return this.norms.take(adjFaces).average();
        });

        this.norms = vertNormals;
    }
}

// ================ Obj ===================

export function meshFromObj(text: string): ShaderMesh {
    // This is not a full .obj parser.
    // see http://paulbourke.net/dataformats/obj/
    // INDEXES ORIGINALLY REFER TO LINES, so -1 is needed

    // run through all lines, and temporarely store
    // all data in raw number lists, since we dont know how
    // many vertices or faces well get.
    let verts: number[] = []; // 3 long float
    let norms: number[] = []; // 3 long float
    let uvs: number[] = []; // 2 long float
    let faces: number[] = []; // 9 long ints, u16's should suffice.

    // note : this is very inefficient, but it'll have to do for now...
    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split("\n");

    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i].trim();

        // filter out comments
        if (line === "" || line.startsWith("#")) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);

        switch (keyword) {
            case "v":
                for (const part of parts) {
                    verts.push(parseFloat(part));
                }
                break;
            case "vn":
                for (const part of parts) {
                    norms.push(parseFloat(part));
                }
                break;
            case "vt":
                for (const part of parts) {
                    uvs.push(parseFloat(part));
                }
                break;
            case "f":
                for (const value of ProcessObjFace(parts)) {
                    faces.push(value);
                }
                break;
            default:
                console.warn("unhandled keyword:", keyword); // eslint-disable-line no-console
                continue;
        }
    }
    // console.log("number of vertices: " + verts.length / 3);
    // console.log("number of faces: " + faces.length / 3);
    // console.log("number of uvs: " + uvs.length / 2);
    // console.log("number of norms: " + norms.length / 3);

    let mesh = ShaderMesh.fromData(verts, norms, uvs, faces);

    return mesh;
}

// NOTE: for now, uv and normals are completely ignored!!!
// we assume the indices are the same als the vertices!!!
// verbose way of processing one single vertex/normal/uv combination in a face.
function ProcessObjFaceVertex(part: string): number[] {
    // make sure data always has length: 3
    let data: number[] = [];

    // cut string apart and process it
    let subparts = part.split("/");
    if (subparts.length == 1) {
        data.push(parseInt(subparts[0]) - 1);
        // data.push(0);
        // data.push(0);
    } else if (subparts.length == 3) {
        data.push(parseInt(subparts[0]) - 1);
        // data.push(parseInt(subparts[1])-1);
        // data.push(parseInt(subparts[2])-1);
    } else {
        throw "invalid face found when processing";
    }
    return data;
}

// process a face entry in an obj file
function ProcessObjFace(parts: string[]): number[] {
    let data: number[] = [];

    if (parts.length == 4) {
        // i dont want to deal with quads for now, create 2 faces from a quad
        let a = ProcessObjFaceVertex(parts[0]);
        let b = ProcessObjFaceVertex(parts[1]);
        let c = ProcessObjFaceVertex(parts[2]);
        let d = ProcessObjFaceVertex(parts[3]);

        data.push(...a, ...b, ...c, ...a, ...c, ...d);
    } else if (parts.length == 3) {
        // as normal
        let a = ProcessObjFaceVertex(parts[0]);
        let b = ProcessObjFaceVertex(parts[1]);
        let c = ProcessObjFaceVertex(parts[2]);
        data.push(...a, ...b, ...c);
    }

    // data always has length 9 or 18
    return data;
}
