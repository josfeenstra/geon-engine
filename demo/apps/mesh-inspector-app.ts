// name:    shapes-app.ts
// author:  Jos Feenstra
// purpose: test creation of basic mesh shapes. Test UI

import {
    App,
    Camera,
    DotShader,
    LineShader,
    MeshDebugShader,
    ShadedMeshShader,
    Plane,
    MultiLine,
    ShaderMesh,
    Parameter,
    UI,
    Vector3,
    Mesh,
    InputState,
    EnumParameter,
    Context,
} from "../../src/lib";

export class MeshInspectorApp extends App {
    // renderinfo
    camera: Camera;
    dotRenderer: DotShader;
    lineRenderer: LineShader;
    meshRenderer: MeshDebugShader;
    shadedMeshRenderer: ShadedMeshShader;

    // geo data
    plane: Plane = Plane.WorldXY();
    grid?: MultiLine;
    geo: ShaderMesh[] = [];

    // logic data
    size = 10;
    cellSize = 0.5;

    distance = new Parameter("distance", 3.0, 0, 4.0, 0.01);
    radius = new Parameter("radius", 1.0, 0, 4.0, 0.01);
    detail = new Parameter("detail", 5, 0, 100, 1);
    shademethod = EnumParameter.new("render method", 0, ["debug", "vertex shaded", "face shaded"]);

    constructor(gl: WebGLRenderingContext) {
        // setup render env
        super(gl);
        let canvas = gl.canvas as HTMLCanvasElement;

        // TODO abstract this to scene
        this.camera = new Camera(canvas);
        this.camera.z_offset = -10;
        this.camera.angleAlpha = 0.4;
        this.camera.angleBeta = 0.5;

        this.dotRenderer = new DotShader(gl, 4, [0, 1, 0, 1]);
        this.meshRenderer = new MeshDebugShader(gl, [0.6, 0, 0, 1], [1, 0, 0, 1]);
        this.lineRenderer = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.shadedMeshRenderer = new ShadedMeshShader(gl);
    }

    ui(ui: UI) {
        // TODO : think of a system that ties parameter & slider together fully

        ui.addParameter(this.radius, (value) => {
            this.start();
        });

        ui.addParameter(this.distance, (value) => {
            this.start();
        });

        ui.addParameter(this.detail, (value) => {
            this.start();
        });

        // render methods
        ui.addParameter(this.shademethod, (val) => {
            this.start();
        });
    }

    start() {
        let grid = MultiLine.fromGrid(
            this.plane.clone().moveTo(new Vector3(0, 0, -this.radius.get())),
            100,
            2,
        );
        let spherePerRing = this.detail.get() * 2;

        let rad = this.radius.get();
        let dis = this.distance.get();
        let det = this.detail.get();

        let mesh = Mesh.fromJoin([
            Mesh.newSphere(
                new Vector3(dis, 0, 0),
                this.radius.get(),
                this.detail.get(),
                spherePerRing,
            ),
            // PureMesh.fromCube(new Cube(this.plane, Domain3.fromRadius(this.radius.get()))),
            Mesh.newCone(
                new Vector3(-dis, 0, -this.radius.get()),
                this.radius.get(),
                this.radius.get() * 2,
                spherePerRing,
            ),
            Mesh.newCylinder(new Vector3(0, 0, -rad), new Vector3(0, 0, rad), rad, det),
        ]);
        let rend = mesh.ToShaderMesh();
        rend.calculateVertexNormals();

        // TODO abstract this to scene
        console.log("normal type", rend.getNormalType());
        if (this.shademethod.get() == 0) {
            this.meshRenderer.set(rend);
        } else if (this.shademethod.get() == 1) {
            this.shadedMeshRenderer.set(rend);
        } else {
            rend.calculateFaceNormals();
            this.shadedMeshRenderer.set(rend);
        }

        this.lineRenderer.set(grid);
        // this.dotRenderer.set(mesh.verts, DrawSpeed.StaticDraw);
    }

    update(state: InputState) {
        // move the camera with the mouse
        this.camera.update(state);
    }

    draw(gl: WebGLRenderingContext) {
        // TODO abstract this to 'scene'
        let c = new Context(this.camera);
        let matrix = this.camera.totalMatrix;
        this.dotRenderer.render(c);

        if (this.shademethod.get() == 0) {
            this.meshRenderer.render(c);
        } else {
            this.shadedMeshRenderer.render(c);
        }

        this.lineRenderer.render(c);
    }
}
