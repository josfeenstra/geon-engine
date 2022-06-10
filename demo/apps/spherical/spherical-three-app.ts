// TODO
// - improve quadification: less triangles!
// - improve squarification: speed & equal sizes
// - Make big sphere and funky texture dancing around on it

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
    IntMatrix,
    Context,
} from "../../../src/lib";

import {
    averageEdgeLength,
    laPlacian,
    quadification,
    squarification,
    createGraph,
    createTileWorld,
    meshifyTileWorld,
    meshifyGraphSurface,
} from "./spherical";

//
//
//
export class SphericalThreeApp extends App {
    // ui
    randomEdges!: Parameter;
    smooth!: Parameter;
    subCount!: Parameter;
    quadSubCount!: Parameter;
    rotate!: Parameter;

    // state
    radius = 1.0;
    graph!: Graph;
    avEdgeLength!: number;
    smoothlimit = 0;
    cca?: number;
    world!: ShaderMesh;
    worldFloor!: ShaderMesh;

    // render data
    camera: Camera;
    meshRend: ShadedMeshShader;
    floorRend: ShadedMeshShader;

    debugRend: MeshDebugShader;
    graphRend: GraphDebugShader;

    tiles!: IntMatrix;

    constructor(gl: WebGLRenderingContext) {
        super(gl, "Multiple Layers of spherical geometry");

        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, 1, true);
        this.camera.set(-2, 1.24, -0.71);

        this.meshRend = new ShadedMeshShader(gl);
        this.floorRend = new ShadedMeshShader(gl);
        // this.meshRend = new MeshDebugRenderer(gl, [0, 0, 0, 1], [0.3, 0.3, 0.3, 1], false);
        this.debugRend = new MeshDebugShader(gl, [0.5, 0, 0, 1], [0, 0, 0, 1], false);
        this.graphRend = new GraphDebugShader(gl, [0.5, 0.5, 0.5, 1], [1, 1, 1, 1]);
    }

    ui(ui: UI) {
        let reset = () => {
            // this.rotate.set(0);
            this.start();
        };

        this.rotate = Parameter.newBoolean("rotate", false);
        this.randomEdges = new Parameter("randomEdges", 1, 0, 1, 1);
        this.smooth = new Parameter("smooth", 0, 0, 1, 1);
        this.subCount = new Parameter("sub count", 2, 0, 4, 1);
        this.quadSubCount = new Parameter("sub count quad", 1, 0, 2, 1);

        ui.addBooleanParameter(this.rotate);
        ui.addBooleanParameter(this.randomEdges, reset);
        ui.addBooleanParameter(this.smooth);
        ui.addParameter(this.subCount, reset);
        ui.addParameter(this.quadSubCount, reset);
        ui.addButton("recalculate", reset);
    }

    start() {
        // set some values
        this.radius = 1;
        this.smoothlimit = 0;

        // create the graph
        this.graph = createGraph(
            1,
            this.subCount.get(),
            this.quadSubCount.get(),
            this.randomEdges.get(),
        );

        // create the tile data
        this.tiles = createTileWorld(this.graph.allVertLoopsAsInts().length, 4);

        // set renderers
        // this.graphRend.set(this.graph, DrawSpeed.DynamicDraw);
        this.avEdgeLength = averageEdgeLength(this.graph);

        // buffer
        this.bufferWorld();
    }

    update(state: InputState) {
        this.camera.update(state);

        let pulse = Math.sin(state.newTime);

        // rotate
        if (this.rotate.get() == 1) {
            let rot = Matrix4.newAxisRotation(Vector3.unitZ(), state.tick * 0.0001);
            this.world.position.multiply(rot);
            this.worldFloor.position.multiply(rot);
            this.meshRend.setShallow(this.gl, this.world);
            this.floorRend.setShallow(this.gl, this.worldFloor);
        }

        this.smoothWorld();
    }

    draw(gl: WebGLRenderingContext) {
        let c = new Context(this.camera);
        this.meshRend.setShallow(this.gl, this.world);
        this.meshRend.render(c);

        this.meshRend.render(c);
        this.floorRend.render(c);
    }

    bufferWorld() {
        this.world = meshifyTileWorld(this.graph, this.tiles, this.radius, 0.1);
        this.world.calculateFaceNormals();

        this.world.color = [0.9, 0.9, 0.9, 1];
        this.meshRend.set(this.world, DrawSpeed.StaticDraw);

        this.worldFloor = meshifyGraphSurface(this.graph);
        this.worldFloor.calculateFaceNormals();
        this.worldFloor.color = [0.3, 0.3, 0.3, 1];
        this.floorRend.set(this.worldFloor, DrawSpeed.StaticDraw);
    }

    smoothWorld() {
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

                // this.graphRend.set(this.graph, DrawSpeed.DynamicDraw);
                this.bufferWorld();
            }
        } else {
            this.smoothlimit = 0;
        }
    }
}
