import { Bezier } from "../../../src/geo/curve/bezier";
import { BezierSquare } from "../../../src/geo/surface/bezier-square";
import { Loft } from "../../../src/geo/surface/loft";
import {
    App,
    Parameter,
    Vector3,
    MultiLine,
    Camera,
    DotShader,
    LineShader,
    MeshDebugShader,
    UI,
    Polyline,
    Plane,
    DrawSpeed,
    InputState,
    Context,
    Domain3,
    Util,
    Domain2,
    MultiVector2,
    Perlin,
    Circle3,
    Mesh,
} from "../../../src/lib";
import { Random } from "../../../src/math/random";

export class SurfaceCpApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    seed: number;
    dots: Vector3[];
    lines: MultiLine[];
    plane = Plane.WorldXY();
    surface?: BezierSquare;

    // render
    camera: Camera;
    lrGrid: LineShader;
    lrRed: LineShader;
    mr: MeshDebugShader;
    drBlue: DotShader;
    mr2: MeshDebugShader;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, -2, true);
        this.camera.setState([21.926, 11.337, -10.04, -10, 1.12, 1.08]);

        this.seed = Random.randomSeed();
        this.dots = [];
        this.lines = [];

        this.drBlue = new DotShader(gl, 10, [0, 0, 1, 1], false);
        this.lrRed = new LineShader(gl, [1, 0, 0, 1]);
        this.lrGrid = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.mr = new MeshDebugShader(gl, [1, 0, 0, 0.5], [1, 0.5, 0.5, 0.5]);
        this.mr2 = new MeshDebugShader(gl, [0, 1, 1, 0.25], [0, 1, 1, 0.75])
    }

    ui(ui: UI) {
        this.params.push(Parameter.new("degree", 3, 2, 6, 1));
        ui.addParameter(this.params[0], this.start.bind(this));
        this.params.push(Parameter.new("displace", 4, 0, 10, 0.001));
        ui.addParameter(this.params[1], this.start.bind(this));
        this.params.push(Parameter.new("detail", 50, 2, 100, 1));
        ui.addParameter(this.params[2], this.start.bind(this));
        // this.params.push(Parameter.new("select", 0, 0, 20, 1));
        // ui.addParameter(this.params[3], this.start.bind(this));
    }

    start() {
        // create a base grid
        this.startGrid();

        // get all parameters
        let degree = this.params[0].get();
        let displace = this.params[1].get();
        let detail = this.params[2].get();
        // let select = this.params[3].get();

        // get some points
        let rng = Random.fromSeed(this.seed);
        let vecs = Domain2.fromRadius(-11) // span a (-size to size)**2 domain
            .offset([-22, 22, 0, 0]) // flip it
            .spawn(degree + 1, degree + 1) // spawn a bunch of points, the exact amound needed for the surface
            .to3D()
            .forEach((v) => {
                return v
                    .add(Vector3.fromRandomUnit(rng).scale(displace))
                    .add(Vector3.unitZ().scale(5)); // and displace them slightly
            });

        // create a surface from it
        let surface = BezierSquare.new(vecs, degree, degree)!;
        this.surface = surface;
        this.drBlue.set(vecs);

        // lines
        this.lines = [];
        // this.lines.push(Circle3.newPlanar(vecs.get(select), 1).buffer());

        // mesh
        // this.drBlue.set(surface.buffer(detail, detail).verts);
        this.mr.set(surface.buffer(detail, detail).ToShaderMesh());
    }

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY(), 100, 2);
        this.lrGrid.set(grid, DrawSpeed.StaticDraw);
    }

    update(state: InputState) {
        this.camera.update(state);
        this.updateCursor(state);
    }

    updateCursor(state: InputState) {
        // render mouse to world line
        let ray = this.camera.getMouseWorldRay(state.canvas.width, state.canvas.height);
        let t = ray.xPlane(this.plane);
        let point = ray.at(20);
        let meshes = [];
        
        meshes.push(Mesh.newSphere(point, 1, 10,10));
        let uv = this.surface!.approxClosestPoint(point);
        let p2 = this.surface!.pointAtUV(uv);

        meshes.push(Mesh.newSphere(p2, 1, 10,10));
        this.mr2.set(Mesh.fromJoin(meshes).ToShaderMesh(), DrawSpeed.DynamicDraw);
    }

    draw(gl: WebGLRenderingContext) {
        const canvas = gl.canvas as HTMLCanvasElement;
        let matrix = this.camera.totalMatrix;
        let c = new Context(this.camera);

        this.lrRed.setAndRender(MultiLine.fromJoin(this.lines), c);
        this.drBlue.render(c);
        this.lrGrid.render(c);
        this.mr.render(c);
        this.mr2.render(c);
    }
}
