import { Bezier } from "../../../src/geo/curve/bezier";
import { BezierSquare } from "../../../src/geo/surface/bezier-square";
import { Loft } from "../../../src/geo/surface/loft";
import {
    App,
    Parameter,
    Vector3,
    MultiLine,
    Camera,
    DotRenderer3,
    LineRenderer,
    MeshDebugRenderer,
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
} from "../../../src/lib";
import { Random } from "../../../src/math/random";

export class SurfaceApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    seed: number;
    dots: Vector3[];
    lines: MultiLine[];

    // render
    camera: Camera;
    lrGrid: LineRenderer;
    lrRed: LineRenderer;
    mr: MeshDebugRenderer;
    drBlue: DotRenderer3;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, -2, true);
        this.camera.setState([21.926, 11.337, -10.04, -10, 1.12, 1.08]);

        this.seed = Random.randomSeed();
        this.dots = [];
        this.lines = [];

        this.drBlue = new DotRenderer3(gl, 10, [0, 0, 1, 1], false);
        this.lrRed = new LineRenderer(gl, [1, 0, 0, 1]);
        this.lrGrid = new LineRenderer(gl, [0.3, 0.3, 0.3, 1]);
        this.mr = new MeshDebugRenderer(gl, [1, 0, 0, 0.5], [1, 1, 1, 0.5]);
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
        let surface = BezierSquare.new(vecs)!;
        this.drBlue.set(vecs);

        // lines
        this.lines = [];
        // this.lines.push(Circle3.newPlanar(vecs.get(select), 1).buffer());

        // mesh
        // this.drBlue.set(surface.buffer(detail, detail).verts);
        this.mr.set(surface.buffer(detail, detail).toRenderable());
    }

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY(), 100, 2);
        this.lrGrid.set(grid, DrawSpeed.StaticDraw);
    }

    update(state: InputState) {
        this.camera.update(state);
    }

    draw(gl: WebGLRenderingContext) {
        const canvas = gl.canvas as HTMLCanvasElement;
        let matrix = this.camera.totalMatrix;
        let c = new Context(this.camera);

        this.lrRed.setAndRender(MultiLine.fromJoin(this.lines), c);
        this.drBlue.render(c);
        this.lrGrid.render(c);
        this.mr.render(c);
    }
}
