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
} from "../../../src/lib";
import { Stopwatch } from "../../../src/system/stopwatch";

export class LoftApp extends App {
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
        this.params.push(Parameter.new("u", 0.5, 0, 1, 0.001));
        ui.addParameter(this.params[0], this.start.bind(this));
        this.params.push(Parameter.new("v", 0.5, 0, 1, 0.001));
        ui.addParameter(this.params[1], this.start.bind(this));
        this.params.push(Parameter.new("displace bottom", 0, -5, 5, 0.001));
        ui.addParameter(this.params[2], this.start.bind(this));

        this.params.push(Parameter.new("detail", 10, 2, 100, 1));
        ui.addParameter(this.params[this.params.length - 1], this.start.bind(this));
    }

    start() {
        // create a base grid
        this.startGrid();

        // get all parameters
        let u = this.params[0].get();
        let v = this.params[1].get();
        let y = this.params[2].get();
        let detail = this.params[this.params.length - 1].get();

        // 2 - loft
        let loftcurves = [
            Bezier.fromList([
                Vector3.new(3, -1, 4),
                Vector3.new(1, -2, 4),
                Vector3.new(1, 2, 4.5),
                Vector3.new(-1, 1, 4),
            ]),
            Bezier.fromList([
                Vector3.new(3, -1, 2),
                Vector3.new(1, -1, 1.5),
                Vector3.new(1, 1, 1.5),
                Vector3.new(-1, 1, 2),
                Vector3.new(-2, 1, 2),
                Vector3.new(-4, 2, 3),
            ]),
            Bezier.fromList([
                Vector3.new(3, -1, 0),
                Vector3.new(1, -1, 0),
                Vector3.new(1, 1, 0),
                Vector3.new(-1, 1, 0),
            ]),
        ];

        loftcurves[2].move(Vector3.new(0, y, 0));
        let loft = Loft.new(loftcurves);

        // dots
        this.dots = [];
        this.dots.push(loft.pointAt(u, v));

        // lines
        this.lines = [];
        this.lines.push(loft.isoCurveV(u).buffer(detail));
        this.lines.push(loft.isoCurveU(v).buffer(detail));

        // mesh
        this.mr.set(loft.buffer(detail, detail).ToShaderMesh());
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
        this.mr.render(c);
    }
}
