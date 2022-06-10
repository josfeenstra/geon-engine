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

export class BezierCpApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    dots: Vector3[];
    lines: MultiLine[];
    plane = Plane.WorldXY();
    point = Vector3.zero();
    bezier?: Bezier;

    // render
    camera: Camera;
    drRed: DotShader;
    lrGrid: LineShader;
    lrRed: LineShader;
    mr: MeshDebugShader;
    lrBlue: LineShader;
    drBlue: DotShader;
    lrWhite: LineShader;

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
        this.lrWhite = new LineShader(gl, [1, 1, 1, 1]);
        this.lrGrid = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.mr = new MeshDebugShader(gl, [1, 0, 0, 0.5], [1, 1, 1, 0.5]);
    }

    ui(ui: UI) {
        this.params.push(Parameter.new("t", 0.6, 0, 1, 0.001));
        ui.addParameter(this.params[0], this.start.bind(this));

        this.params.push(Parameter.new("detail", 50, 2, 100, 1));
        ui.addParameter(this.params[this.params.length - 1], this.start.bind(this));
    }

    start() {
        // create a base grid
        this.startGrid();

        // get all parameters
        let t = this.params[0].get();
        let detail = this.params[this.params.length-1].get();

        // 1 - bezier
        this.bezier = Bezier.fromList([
            Vector3.new(-2, -2, 0),
            Vector3.new(-2, 2, 0),
            Vector3.new(2, 2, 0),
            Vector3.new(2, -2, 0),
        ]);
        let bezier = this.bezier!;

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
        let grid = MultiLine.fromGrid(this.plane, 100, 2);
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
        this.point = ray.at(t);
        let lines = [];
        lines.push(Circle3.newPlanar(this.point, 0.1).buffer());

        
        t = this.bezier!.ApproxClosestPoint(this.point);
        let p2 = this.bezier!.pointAt(t);

        lines.push(Circle3.newPlanar(p2, 0.1).buffer());
        this.lrBlue.set(MultiLine.fromJoin(lines));
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
        this.lrWhite.render(c);
        // this.mr.render(c);
    }
}
