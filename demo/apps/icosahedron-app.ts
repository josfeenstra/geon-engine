// name:    obj-loader-app.ts
// author:  Jos Feenstra
// purpose: test statistic functionalties

import {
    App,
    Camera,
    ShadedMeshShader,
    Parameter,
    Graph,
    ShaderMesh,
    Vector3,
    UI,
    InputState,
    Matrix4,
    DrawSpeed,
    Mesh,
    NormalShader,
    Context,
} from "../../src/lib";

export class IcosahedronApp extends App {
    camera: Camera;
    meshRend: ShadedMeshShader;
    normalRend: NormalShader;

    rotate!: Parameter;
    inner!: Parameter;
    radius = 0.1; // radius!: Parameter;
    detail = 6; // detail!: Parameter;

    graph!: Graph;
    mesh!: ShaderMesh;

    constructor(gl: WebGLRenderingContext) {
        super(gl);
        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, 8, true);
        this.meshRend = new ShadedMeshShader(gl);
        this.normalRend = new NormalShader(gl);
    }

    getIcosahedron(): Graph {
        let graph = Mesh.newIcosahedron(1).toGraph();
        // let graph = Mesh.newCylinder(Vector3.new(0,0,-1), Vector3.new(0,0,1), 1, 4).toGraph();
        // let graph = Mesh.newSphere(Vector3.new(0,0,0), 1, 5, 10).toGraph().toMesh().toGraph();
        // graph.print();
        return graph;
    }

    getDemoShape(): Graph {
        let graph = Graph.new();

        function addVert(v: Vector3) {
            graph.addVert(v, v);
        }

        addVert(new Vector3(-1, 0, -1)); // 0
        addVert(new Vector3(0, 1, -1)); // 1
        addVert(new Vector3(1, 0, -1)); // 2
        addVert(new Vector3(0, -1, -1)); // 3
        addVert(new Vector3(0, 0, 1)); // 4

        addVert(new Vector3(-1, 1, 0)); // 5 (should be inserted between 0 and 1)

        graph.addEdge(4, 0);
        graph.addEdge(4, 1);
        graph.addEdge(4, 2);
        graph.addEdge(4, 3);
        // graph.addEdge(4,5);

        graph.addEdge(0, 1);
        graph.addEdge(1, 2);
        graph.addEdge(2, 3);
        graph.addEdge(3, 0);
        graph.addEdge(1, 3);

        graph.print();

        return graph;
    }

    demo(): Graph {
        let graph = new Graph();
        let normal = new Vector3(0, 0, 1);
        graph.addVert(new Vector3(0, 0, 0), normal); // 0
        graph.addVert(new Vector3(1, 0, 0), normal); // 1
        graph.addVert(new Vector3(0, 1, 0), normal); //
        graph.addVert(new Vector3(-1, 0, 0), normal); //
        graph.addVert(new Vector3(0, -1, 0), normal); //

        graph.addEdge(0, 1);
        graph.addEdge(0, 2);
        graph.addEdge(0, 3);
        graph.addEdge(0, 4);
        graph.addEdge(1, 2);

        return graph;
    }

    ui(ui: UI) {
        this.rotate = new Parameter("rotate", 1, 0, 1, 1);
        this.inner = new Parameter("inner", 1, 0, 1, 1);

        // this.radius = new Parameter("radius", 0.1, 0, 0.5, 0.01)
        // this.detail = new Parameter("detail", 6, 3, 20, 1)

        let reset = () => {
            // this.rotate.set(0);
            this.start();
        };

        ui.addBooleanParameter(this.rotate);
        ui.addBooleanParameter(this.inner, reset);
        // ui.addParameter(this.radius, reset);
        // ui.addParameter(this.detail, reset);
        // ui.addButton(() => {this.start()})
    }

    start() {
        this.graph = this.getIcosahedron();
        this.mesh = graphToMultiMesh(this.graph, this.radius, this.detail, this.inner.get() == 1);
        this.meshRend.set(this.mesh);
        // this.normalRend.set(this.graph.toRenderable(), DrawSpeed.DynamicDraw);

        // console.log("all loops: ", this.graph.allLoops());
    }

    update(state: InputState) {
        this.camera.update(state);

        if (!state.mouseRightDown && this.rotate.get() == 1) {
            let alpha = 0.0002 * state.tick;
            let rot = Matrix4.newXRotation(alpha).multiply(Matrix4.newYRotation(alpha));
            this.mesh!.transform(rot);

            this.meshRend.set(this.mesh, DrawSpeed.DynamicDraw);
        }
    }

    draw(gl: WebGLRenderingContext) {
        let c = new Context(this.camera);
        this.meshRend.render(c);
        // this.normalRend.render(gl, this.camera);
    }
}

export function graphToMultiMesh(
    graph: Graph,
    radius: number,
    detail: number,
    inner: boolean,
    balls = true,
): ShaderMesh {
    let meshes: Mesh[] = [];

    if (balls) {
        graph.allVertPositions().forEach((v) => {
            meshes.push(Mesh.newSphere(v, radius * 2, detail, detail * 2));
        });
    }

    let edges = graph.allEdgeVerts();
    for (let i = 0; i < edges.length; i += 2) {
        let from = graph.getVertexPos(edges[i]);
        let to = graph.getVertexPos(edges[i + 1]);
        let mesh = Mesh.newCylinder(from, to, radius, detail);
        meshes.push(mesh);
    }

    if (inner) {
        meshes.push(Mesh.fromGraph(graph));
    }

    let rmesh = Mesh.fromJoin(meshes).ToShaderMesh();
    rmesh.calculateFaceNormals();
    return rmesh;
}
