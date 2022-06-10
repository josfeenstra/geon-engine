import { EdgeIndex, Graph, IntMatrix, Mesh, Plane, ShaderMesh, Vector3 } from "../../../src/lib";

export function createGraph(
    liftType: number,
    subcount: number,
    quadsubcount: number,
    randomEdges: number,
): Graph {
    // 0 | setup
    const mesh = Mesh.newIcosahedron(0.5);
    let graph = mesh.toGraph();
    let center = new Vector3(0, 0, 0);
    let radius = 1;

    // 1 | subdivide
    for (let i = 0; i < subcount; i++) {
        graph.subdivide();

        // lift to sphere after every subdivision
        if (liftType > 0) {
            let count = graph.getVertexCount();
            for (let i = 0; i < count; i++) {
                let pos = graph.getVertexPos(i);
                let normal = pos;

                let dis = center.disTo(pos);
                let lift = radius - dis;
                if (liftType > 1) {
                    pos.add(normal.scaled(lift));
                } else {
                    pos.add(normal.normalized().scaled(lift));
                }
            }
        }
    }

    // 2 | remove random edges
    if (randomEdges == 1) {
        quadification(graph);
    }

    // 3 | subdivide quad
    for (let i = 0; i < quadsubcount; i++) {
        graph.subdivideQuad();
    }

    // lift to sphere after every subdivision
    if (liftType > 0) {
        let count = graph.getVertexCount();
        for (let i = 0; i < count; i++) {
            let pos = graph.getVertexPos(i);
            let normal = graph.getVertexNormal(i);

            let dis = center.disTo(pos);
            let lift = radius - dis;
            if (liftType > 1) {
                pos.add(normal.scaled(lift));
            } else {
                pos.add(normal.normalized().scaled(lift));
            }
        }
    }

    // quad relaxation from beginning?
    return graph;
}

export function createTileWorld(count: number, height: number): IntMatrix {
    let m = new IntMatrix(count, height);
    for (let i = 0; i < m._height; i++) {
        let val = randomInt(m._width + 1);

        for (let j = 0; j < m._width; j++) {
            if (j < val) {
                m.set(i, j, 1);
            } else {
                m.set(i, j, 0);
            }
        }
    }

    return m;
}

export function meshifyGraphSurface(graph: Graph): ShaderMesh {
    // init result
    let meshes: Mesh[] = [];

    // per quad
    let loops = graph.allVertLoopsAsInts();
    for (let i = 0; i < loops.length; i++) {
        const loop = loops[i];
        if (loop.length < 4) {
            console.log("invalids");
            continue;
        }

        let vecs = loop.map((j) => graph.getVertexPos(j));
        let m = Mesh.newQuad([vecs[0], vecs[3], vecs[1], vecs[2]]);
        meshes.push(m);
    }

    let rend = Mesh.fromJoin(meshes).ToShaderMesh();
    rend.calculateVertexNormals();
    return rend;
}

export function meshifyTileWorld(
    graph: Graph,
    tiles: IntMatrix,
    radius: number, // base
    storeyHeight: number, //
): ShaderMesh {
    // init result
    let meshes: Mesh[] = [];

    // per quad
    let loops = graph.allVertLoopsAsInts();
    for (let i = 0; i < loops.length; i++) {
        const loop = loops[i];
        if (loop.length < 4) {
            console.log("invalids");
            continue;
        }

        let vecs = loop.map((j) => graph.getVertexPos(j));
        let row = tiles.getRow(i);

        // fill row
        for (let j = 0; j < tiles._width; j++) {
            let tileType = row[j];
            if (tileType == 0) {
                continue;
            }

            let level = radius + j * storeyHeight;
            let level2 = radius + (j + 1) * storeyHeight;
            let m = Mesh.newOct([
                vecs[0].scaled(level),
                vecs[1].scaled(level),
                vecs[3].scaled(level),
                vecs[2].scaled(level),
                vecs[0].scaled(level2),
                vecs[1].scaled(level2),
                vecs[3].scaled(level2),
                vecs[2].scaled(level2),
            ]);
            meshes.push(m);
        }
    }

    let rend = Mesh.fromJoin(meshes).ToShaderMesh();
    rend.calculateVertexNormals();
    return rend;
}

export function constructMeshFromSphereGraph(
    graph: Graph,
    radius: number, // to project back
    liftBot: number, //
    liftTop: number, //
    rand: number,
): Mesh {
    // recalculate world mesh
    let scaler1 = 1 + liftBot / radius;
    let scaler2 = 1 + liftTop / radius;

    let meshes: Mesh[] = [];
    let loops = graph.allVertLoopsAsInts();
    for (let loop of loops) {
        if (Math.random() > rand) {
            continue;
        }

        if (loop.length < 4) {
            continue;
        }

        let vecs = loop.map((j) => graph.getVertexPos(j));

        let m = Mesh.newOct([
            vecs[0].scaled(scaler1),
            vecs[1].scaled(scaler1),
            vecs[3].scaled(scaler1),
            vecs[2].scaled(scaler1),
            vecs[0].scaled(scaler2),
            vecs[1].scaled(scaler2),
            vecs[3].scaled(scaler2),
            vecs[2].scaled(scaler2),
        ]);

        meshes.push(m);
    }

    let rend = Mesh.fromJoin(meshes);
    return rend;
}

export function averageEdgeLength(graph: Graph): number {
    let count = 0;
    let sum = 0;
    graph.forEveryEdgeVerts((a, b) => {
        sum += a.disTo(b);
        count += 1;
    });

    let average = sum / count;
    return average;
}

export function edgeSmooth(graph: Graph, average: number, scale: number) {
    graph.forEveryEdgeVerts((a, b) => {
        let distance = a.disTo(b);
        let diff = average - distance;
        let vector = b.subbed(a);
        a.add(vector.scaled(-diff * scale));
        b.add(vector.scaled(diff * scale));
    });
}

export function laPlacian(graph: Graph) {
    let count = graph.getVertexCount();
    let news: Vector3[] = [];

    // get center of nbs
    for (let vi = 0; vi < count; vi++) {
        let v = graph.getVert(vi);
        if (v.dead) continue;

        let sum = Vector3.zero();
        let nbs = graph.getVertNeighbors(vi);
        for (let nb of nbs) {
            sum.add(graph.getVertexPos(nb));
        }
        sum.scale(1 / nbs.length);
        news.push(sum);
    }

    // set
    for (let vi = 0; vi < count; vi++) {
        graph.getVertexPos(vi).copy(news[vi]);
    }
}

export function squarification(graph: Graph, centerCornerAverage?: number) {
    // make the quad graph as 'square' as possible

    // prepare
    let faces = graph.allVertLoopsAsInts();
    let count = faces.length;
    let centers = new Array<Vector3>(count);
    let movers = new Array<Vector3>(graph.verts.length);
    let counters = new Array<number>(graph.verts.length);
    for (let i = 0; i < movers.length; i++) {
        movers[i] = Vector3.new(0, 0, 0);
        counters[i] = 0;
    }
    let cca = 0;

    // iterate per face
    for (let i = 0; i < count; i++) {
        // get face, center and corners
        let center = centers[i];
        let face = faces[i];
        let faceCount = face.length;
        if (face.length == 0) {
            throw "HELP, WE ARE NOT DEALING WITH QUADS HERE!";
        }
        center = Vector3.new(0, 0, 0);
        let corners = new Array<Vector3>(faceCount);
        for (let j = 0; j < faceCount; j++) {
            let vi = face[j];
            corners[j] = graph.getVertexPos(vi);
            center.add(corners[j]);
        }
        center.scale(1 / faceCount);

        // now that we have center, calculate cca
        let local_cca = 0;
        for (let j = 0; j < faceCount; j++) {
            local_cca = center.disTo(corners[j]);
        }
        local_cca /= faceCount;
        cca += local_cca;

        // but use the given one if present
        let scaler;
        let cca_diff;

        if (centerCornerAverage) {
            scaler = centerCornerAverage;
            cca_diff = centerCornerAverage - local_cca;
        } else {
            scaler = local_cca;
            cca_diff = 0;
        }

        // rotate all corners into the same space, and get the average of that
        // TODO SAVE TIME BY DOING THIS:
        // new Vector2(v.dot(ihat), v.dot(jhat)).angle()

        let plane = Plane.from3pt(center, corners[0], corners[1]);
        let normedCorners = new Array<Vector3>(face.length);
        let normedCenter = Vector3.new(0, 0, 0);
        let delta = 2 / faceCount;
        for (let j = 0; j < faceCount; j++) {
            normedCorners[j] = plane.rotateVector(corners[j], j * Math.PI * delta);
            normedCenter.add(normedCorners[j]);
        }

        // scale this averaged to the center corner average
        normedCenter.scale(1 / 4);
        let normal = normedCenter.subbed(center).normalize();
        let perfectCorner = center.added(normal.scaled(local_cca));

        // increate gunfactor if square is very small (awww)
        let gunfactor = 1;
        let equalizer = 200;
        gunfactor += Math.max(-1 * cca_diff * equalizer, 0);

        // console.log(gunfactor);

        // rotate this average back, and add it to the movers of every vertex
        for (let j = 0; j < faceCount; j++) {
            let vi = face[j];
            let v = plane.rotateVector(perfectCorner, j * Math.PI * delta);
            movers[vi].add(v.scaled(gunfactor));
            counters[vi] += 1;
        }
    }

    // now, move the graph
    for (let i = 0; i < movers.length; i++) {
        let mover = movers[i];
        let counter = counters[i];
        if (counter < 1) {
            continue;
        }
        let v = graph.getVertexPos(i);
        v.add(mover.scale(1 / counter));
    }

    // return the center corner average, to be used in the next cycle
    cca /= count;
    return cca;
}

export function quadification(graph: Graph) {
    // edge deletion heuristic:
    // remove edges between two triangles to create a quad.
    // keep removing edges until no triangle neighbors another triangle.

    // prepare
    let count = graph.edges.length;
    let edgeIds = new Array<EdgeIndex>(count);
    let visited = new Array<boolean>(count);

    graph.edges.forEach((e, i) => {
        edgeIds[i] = i;
        visited[i] = false;
    });

    // shuffle
    let shuffler = (a: any, b: any) => {
        return 0.5 - Math.random();
    };
    edgeIds.sort(shuffler);

    // per edge
    for (let i = 0; i < count; i++) {
        let ei = edgeIds[i];
        let e = graph.edges[ei];
        if (e.dead || visited[ei]) {
            continue;
        }

        let loops = graph.getLoopsAdjacentToEdge(ei);

        // only delete edges between triangles

        if (loops[0].length > 3 || loops[1].length > 3) {
            continue;
        }

        // the edges of this new quad should not be touched!
        for (let loop of loops) {
            for (let edgeIndex of loop) {
                visited[edgeIndex] = true;
            }
        }

        // now remove this edge itself
        graph.deleteEdgeByIndex(ei);
    }
}

export function randomInt(max: number) {
    return Math.floor(Math.random() * max);
}
