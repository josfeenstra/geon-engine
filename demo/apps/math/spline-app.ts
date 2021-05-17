import { Bezier } from "../../../src/geo/curve/bezier";
import { Loft } from "../../../src/geo/surface/loft";
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
    Polyline,
    ShadedMeshRenderer,
    MeshDebugRenderer,
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
    mr: MeshDebugRenderer;

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
        this.mr = new MeshDebugRenderer(gl, [1, 0, 0, 0.5], [1, 1, 1, 0.5]);
    }

    ui(ui: UI) {
        this.params.push(Parameter.new("t", 0, 0, 1, 0.001));
        this.params.push(Parameter.new("u", 0.5, 0, 1, 0.001));
        this.params.push(Parameter.new("v", 0.5, 0, 1, 0.001));

        this.params.push(Parameter.new("y", 0, -5, 5, 0.001));
        this.params.push(Parameter.new("detail", 10, 2, 100, 1));

        for (let param of this.params) {
            ui.addParameter(param, this.start.bind(this));
        }
    }

    start() {
        this.startGrid();

        let curve1 = Bezier.new([
            Vector3.new(3, -1, 4),
            Vector3.new(1, -2, 4),
            Vector3.new(1, 2, 4.5),
            Vector3.new(-1, 1, 4),
        ]);

        let curve2 = Bezier.new([
            Vector3.new(3, -1, 2),
            Vector3.new(1, -1, 1.5),
            Vector3.new(1, 1, 1.5),
            Vector3.new(-1, 1, 2),
            Vector3.new(-2, 1, 2),
        ])!;

        let curve3 = Bezier.new([
            Vector3.new(3, -1, 0),
            Vector3.new(1, -1, 0),
            Vector3.new(1, 1, 0),
            Vector3.new(-1, 1, 0),
        ])!;

        let t = this.params[0].get();
        let u = this.params[1].get();
        let v = this.params[2].get();
        let y = this.params[3].get();
        let detail = this.params[4].get();

        curve2.move(Vector3.new(0, y, 0));

        // buffer:

        let curves = [curve1, curve2, curve3];
        let loft = Loft.new(curves);

        // dots
        this.dots = [];
        this.dots.push(curve1.eval(t));
        this.dots.push(curve2.eval(t));
        this.dots.push(loft.eval(u, v));

        // lines
        this.lines = [];
        for (let curve in [curve1]) this.lines.push(curve1.buffer(100));
        this.lines.push(curve2.buffer(100));
        // for (let dot of this.dots) {
        //     this.lines.push(Circle3.newPlanar(dot, 0.1).buffer());
        // }

        // mesh
        this.mr.set(Mesh.fromSurface(loft, detail, detail).toRenderable());
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
        this.mr.render(c);
    }
}
