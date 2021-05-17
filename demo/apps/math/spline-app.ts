import { Bezier } from "../../../src/geo/spline";
import {
    App,
    DotRenderer3,
    LineRenderer,
    Camera,
    Vector3,
    MultiLine,
    InputState,
    Parameter,
    MultiVector3,
    DrawSpeed,
    Plane,
    Context,
    UI,
    Circle3,
    Mesh,
} from "../../../src/lib";

export class SplineApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    dots: Vector3[];
    lines: MultiLine[];

    // render
    camera: Camera;
    drRed: DotRenderer3;
    lrGrid: LineRenderer;
    lrRed: LineRenderer;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, -2, true);
        this.camera.set(-10, 1, 1);

        this.dots = [];
        this.lines = [];

        this.drRed = new DotRenderer3(gl, 10, [1, 0, 0, 1], false);
        this.lrRed = new LineRenderer(gl, [1, 0, 0, 1]);
        this.lrGrid = new LineRenderer(gl, [0.3, 0.3, 0.3, 1]);
    }

    ui(ui: UI) {
        let param = Parameter.new("t", 0, 0, 1, 0.001);
        this.params.push(param);
        ui.addParameter(param, this.start.bind(this));
    }

    start() {
        this.startGrid();
        this.dots = [];
        this.lines = [];
        this.dots.push(
            Vector3.new(3, -1, 0),
            Vector3.new(1, -1, 0),
            Vector3.new(1, 1, 0),
            Vector3.new(-1, 1, 0),
        );

        let spline = Bezier.new(this.dots, 3)!;
        this.lines.push(MultiLine.fromCurve(spline));
        let t = this.params[0].get();

        this.dots.push(spline.eval(t));

        for (let dot of this.dots) {
            this.lines.push(Circle3.newPlanar(dot, 0.1).buffer());
        }
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

        this.drRed.setAndRender(this.dots, c);
        this.lrRed.setAndRender(MultiLine.fromJoin(this.lines), c);
        this.lrGrid.render(c);
    }
}
