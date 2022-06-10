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
} from "../../../src/lib";
import { Polynomial } from "../../../src/math/polynomial";
import { Stopwatch } from "../../../src/system/stopwatch";

export class BezierApp extends App {
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
        this.params.push(Parameter.new("increase degree", 0, 0, 10, 1));
        ui.addParameter(this.params[1], this.start.bind(this));
        this.params.push(Parameter.new("cut", 1, 0, 1, 0.001));
        ui.addParameter(this.params[2], this.start.bind(this));
        this.params.push(Parameter.new("expand", 0, 0, 1, 0.001));
        ui.addParameter(this.params[3], this.start.bind(this));

        this.params.push(Parameter.new("detail", 50, 2, 100, 1));
        ui.addParameter(this.params[this.params.length - 1], this.start.bind(this));
    }

    start() {
        // create a base grid
        this.startGrid();

        // get all parameters
        let t = this.params[0].get();
        let sub = this.params[1].get();
        let cut = this.params[2].get();
        let exp = this.params[3].get();
        let detail = this.params[this.params.length - 1].get();

        // 1 - bezier
        let bezier = Bezier.fromList([
            Vector3.new(-2, -2, 0),
            Vector3.new(-2, 2, 0),
            Vector3.new(2, 2, 0),
            Vector3.new(2, -2, 0),
        ]);

        let leftover: Bezier;
        [bezier, leftover] = bezier.splitAt(cut);

        // subdivide bezier `sub` times
        for (let i = 0; i < sub; i++) {
            bezier = bezier.increaseDegree();
        }

        // extend the curve
        bezier.extend(exp);

        // show decastejau triangle
        let tri = Polynomial.decastejau(bezier.verts, t);

        // turn this triangle to lines
        // iterate over this triangle, starting at the base
        let lines = [];
        let size = bezier.degree + 1;
        for (let col = size - 1; col > -1; col -= 1) {
            if (col < 1) continue;
            let verts = MultiVector3.new(col + 1);

            for (let row = 0; row <= col; row++) {
                let idx = Util.iterateTriangle(col, row);
                verts.set(row, tri.get(idx));
            }
            lines.push(MultiLine.fromPolyline(Polyline.new(verts)));
        }
        // lines.push(leftover.buffer(detail));
        this.lrBlue.set(MultiLine.fromJoin(lines));
        this.drBlue.set(tri);

        // dots
        this.dots = [];
        this.dots.push(...bezier.verts.toList());
        this.dots.push(bezier.pointAt(t));
        this.dots.push(bezier.pointAt(t).add(bezier.tangentAt(t)));
        this.dots.push(bezier.pointAt(t).add(bezier.normalAt(t)));

        // lines
        this.lines = [];
        this.lines.push(bezier.buffer(detail));
        this.lines.push(Circle3.newPlanar(bezier.pointAt(t), 0.1).buffer());
        // for (let curve of loftcurves) {
        //     this.lines.push(curve.buffer(100));
        // }
        // for (let dot of this.dots) {
        //     this.lines.push(Circle3.newPlanar(dot, 0.1).buffer());
        // }
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
