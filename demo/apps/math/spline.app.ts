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
    Util,
    Domain2,
    Domain3,
    MultiVector3,
    Circle3,
    Spline,
} from "../../../src/lib";
import { Polynomial } from "../../../src/math/polynomial";
import { Random } from "../../../src/math/random";
import { Stopwatch } from "../../../src/system/stopwatch";

export class SplineApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    dots: Vector3[];
    lines: MultiLine[];

    // render
    camera: Camera;
    drRed: DotShader;
    lrGrid: LineShader;
    lrRed: LineShader;
    mr: MeshDebugShader;
    lrBlue: LineShader;
    drBlue: DotShader;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, -2, true);
        this.camera.set(-10, 1, 1);

        this.dots = [];
        this.lines = [];

        this.drRed = new DotShader(gl, 10, [1, 0, 0, 1], false);
        this.drBlue = new DotShader(gl, 10, [0, 0, 1, 1], false);
        this.lrRed = new LineShader(gl, [1, 0, 0, 1]);
        this.lrBlue = new LineShader(gl, [0, 0, 1, 1]);
        this.lrGrid = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.mr = new MeshDebugShader(gl, [1, 0, 0, 0.5], [1, 1, 1, 0.5]);
    }

    ui(ui: UI) {
        this.params.push(Parameter.new("t", 0.6, 0, 1, 0.001));
        ui.addParameter(this.params[0], this.start.bind(this));
        this.params.push(Parameter.new("degree", 1, 1, 10, 1));
        ui.addParameter(this.params[1], this.start.bind(this));
        this.params.push(Parameter.new("n control points", 4, 0, 1000, 1));
        ui.addParameter(this.params[2], this.start.bind(this));

        this.params.push(Parameter.new("detail", 50, 2, 1000, 1));
        ui.addParameter(this.params[this.params.length - 1], this.start.bind(this));
    }

    start() {
        // create a base grid
        this.startGrid();

        console.clear();

        // get all parameters
        let t = this.params[0].get();
        let degree = this.params[1].get();
        let count = this.params[2].get();
        // let increaseDegree = this.params[2].get();
        let detail = this.params[this.params.length - 1].get();

        // 1 - bezier
        let domain = Domain3.fromRadii(5, 5, 1);
        let rng = Random.fromSeed(1234);
        let spline = Spline.new(domain.populate(count, rng), degree)!;

        // dots
        this.dots = [];
        this.dots.push(...spline.verts.toList());
        this.dots.push(spline.pointAt(t));

        // lines
        this.lines = [];
        this.lines.push(spline.buffer(detail));
        this.lines.push(Circle3.newPlanar(spline.pointAt(t), 0.1).buffer());
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

        this.lrGrid.render(c);
        this.drRed.setAndRender(this.dots, c);
        this.drBlue.render(c);
        this.lrRed.setAndRender(MultiLine.fromJoin(this.lines), c);
        this.lrBlue.render(c);
        // this.mr.render(c);
    }
}
