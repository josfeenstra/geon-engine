// TODO
// - improve quadification: less triangles!
// - improve squarification: speed & equal sizes

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
    Cube,
    Plane,
    Domain3,
    MeshDebugShader,
    VertIndex,
    EdgeIndex,
    EnumParameter,
    GraphDebugShader,
    Context,
} from "../../../src/lib";

import { Stopwatch } from "../../../src/system/stopwatch";
import { averageEdgeLength, laPlacian, quadification, squarification } from "./spherical";

export class SphericalOneApp extends App {
    camera: Camera;
    meshRend: ShadedMeshShader;
    debugRend: MeshDebugShader;
    graphRend: GraphDebugShader;

    rotate!: Parameter;
    inner!: Parameter;
    subCount!: Parameter;
    quadSubCount!: Parameter;
    liftType!: EnumParameter;
    randomEdges!: Parameter;

    radius = 0.1;

    graph!: Graph;
    rend!: ShaderMesh;
    average!: number;
    smooth!: Parameter;
    smoothlimit = 0;
    cca?: number;

    constructor(gl: WebGLRenderingContext) {
        super(
            gl,
            "setup for trying out different partitions of a sphere. Based on Oskar Stalberg's irregular quad grid",
        );
        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, 1, true);
        this.camera.set(-4.48, 1.24, -0.71);

        this.meshRend = new ShadedMeshShader(gl);
        this.debugRend = new MeshDebugShader(gl, [0.5, 0, 0, 1], [1, 0, 0, 1], false);
        this.graphRend = new GraphDebugShader(gl, [0.5, 0, 0, 1], [255 / 255, 69 / 255, 0, 1]);
    }

    ui(ui: UI) {
        let reset = () => {
            // this.rotate.set(0);
            this.start();
        };

        this.rotate = new Parameter("rotate", 0, 0, 1, 1);
        this.randomEdges = new Parameter("randomEdges", 1, 0, 1, 1);
        this.smooth = new Parameter("smooth", 0, 0, 1, 1);
        this.subCount = new Parameter("sub count", 2, 0, 4, 1);
        this.quadSubCount = new Parameter("sub count quad", 1, 0, 2, 1);
        this.liftType = EnumParameter.new("lift type", 1, ["none", "sphere", "buggy"]);

        ui.addBooleanParameter(this.rotate);
        ui.addBooleanParameter(this.randomEdges, reset);
        ui.addBooleanParameter(this.smooth);
        ui.addParameter(this.subCount, reset);
        ui.addParameter(this.quadSubCount, reset);
        ui.addParameter(this.liftType, reset);
        ui.addButton("recalculate", reset);
    }

    start() {
        let liftType = this.liftType.get();

        // 0 | setup
        const mesh = Mesh.newIcosahedron(0.5);
        let graph = mesh.toGraph();
        let center = new Vector3(0, 0, 0);
        this.smoothlimit = 0;

        if (liftType == 2) {
            this.radius = 1;
        } else {
            this.radius = graph.getVertexPos(0).disTo(center);
        }

        // DEBUG: PERFORMANCE
        console.log("lets start subdivisions!");
        let stopwatch = Stopwatch.new();

        // 1 | subdivide
        for (let i = 0; i < this.subCount.get(); i++) {
            graph.subdivide();

            // lift to sphere after every subdivision
            if (liftType > 0) {
                let count = graph.getVertexCount();
                for (let i = 0; i < count; i++) {
                    let pos = graph.getVertexPos(i);
                    let normal = pos;

                    let dis = center.disTo(pos);
                    let lift = this.radius - dis;
                    if (liftType > 1) {
                        pos.add(normal.scaled(lift));
                    } else {
                        pos.add(normal.normalized().scaled(lift));
                    }
                }
                console.log("lift in ", stopwatch.time(), "ms");
            }
        }

        // DEBUG: PERFORMANCE
        console.log("subdivision in ", stopwatch.time(), "ms");

        // 2 | remove random edges
        if (this.randomEdges.get() == 1) {
            quadification(graph);

            // graph.print();
            // 2 | remove random edges
            // let edges = graph.all();
            // let picks: number[] = [];
            // let pickCount = 100;
            // for (let i = 0 ; i < pickCount; i++) {

            //     let p = randomInt(edges.length);
            //     picks.push(edges[p]);
            // }

            // // // console.log(picks);

            // for (let i = 0 ; i < edges.length; i++) {
            //     if (Math.random() > 0.0) {
            //         let ei = edges[i];
            //         let loops = graph.getLoopsAdjacentToEdge(ei);
            //         if (loops[0].length == 3 && loops[1].length == 3) {
            //             graph.deleteEdgeFromIndex(edges[i]);
            //         }
            //     }
            // }
        }

        console.log("edge removal in ", stopwatch.time(), "ms");

        // 3 | subdivide quad
        for (let i = 0; i < this.quadSubCount.get(); i++) {
            graph.subdivideQuad();
        }

        // DEBUG: PERFORMANCE
        console.log("quad subdivision in ", stopwatch.time(), "ms");

        // lift to sphere after every subdivision
        if (liftType > 0) {
            let count = graph.getVertexCount();
            for (let i = 0; i < count; i++) {
                let pos = graph.getVertexPos(i);
                let normal = graph.getVertexNormal(i);

                let dis = center.disTo(pos);
                let lift = this.radius - dis;
                if (liftType > 1) {
                    pos.add(normal.scaled(lift));
                } else {
                    pos.add(normal.normalized().scaled(lift));
                }
            }
            console.log("lift in ", stopwatch.time(), "ms");
        }

        // 4 | quad relaxation
        this.graph = graph;

        // this.rend = this.graph.toRenderable();
        // this.rend = graphToMultiMesh(this.graph, 0.02, 3, false, true);
        // this.rend.calculateVertexNormals();
        // console.log("num triangles = ", this.rend.mesh.links.count());
        // console.log("to renderable in ", stopwatch.time(), "ms");

        // this.graph.print();
        // let loops = graph.allVertLoopsAsInts();
        // console.log("allVertLoops in ", stopwatch.time(), "ms");
        //console.log(loops);

        // 5 | convert

        if (liftType == 1) {
            let somesphere = Mesh.newSphere(
                Vector3.zero(),
                this.radius * 0.99,
                6,
                10,
            ).ToShaderMesh();
            somesphere.calculateVertexNormals();
            this.meshRend.set(somesphere, DrawSpeed.StaticDraw);
        } else if (liftType == 0) {
            let something = mesh.ToShaderMesh();
            something.transform(Matrix4.newScaler(0.99, 0.99, 0.99));
            something.calculateFaceNormals();
            this.meshRend.set(something, DrawSpeed.StaticDraw);
        }

        this.graphRend.set(this.graph, DrawSpeed.DynamicDraw);
        this.average = averageEdgeLength(this.graph);
        // console.log("edges: ", this.graph.allEdges());
        // console.log("loops: ", this.graph.allVertLoops());
    }

    update(state: InputState) {
        this.camera.update(state);

        if (!state.mouseRightDown && this.rotate.get() == 1) {
            // rotate
            let alpha = 0.0001 * state.tick;
            let rot = Matrix4.newXRotation(alpha).multiply(Matrix4.newYRotation(alpha));
            this.graph.transform(rot);
        }

        // sucessive over relaxation
        if (this.smooth.get() == 1) {
            if (this.smoothlimit < 1000) {
                // squarification smoother

                this.cca = squarification(this.graph, this.cca);
                // this.cca = this.squarification(this.graph);
                // console.log(this.cca);
                laPlacian(this.graph);

                // project back to sphere
                this.graph.verts.forEach((v) => {
                    let normal = v.pos;
                    let lift = this.radius - v.pos.length();
                    v.pos.add(normal.normalized().scaled(lift));
                });
                this.smoothlimit += 1;
            }
        } else {
            this.smoothlimit = 0;
        }

        this.graphRend.set(this.graph, DrawSpeed.DynamicDraw);
    }

    draw(gl: WebGLRenderingContext) {
        let c = new Context(this.camera);
        this.meshRend.render(c);
        this.graphRend.render(c);
    }
}
