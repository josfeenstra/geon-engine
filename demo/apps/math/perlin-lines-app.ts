// NOTE: splines are not nearly efficient enough for this kind of business :).

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
    MultiVector3,
    Spline,
} from "../../../src/lib";
import { Random } from "../../../src/math/random";
import { DotShaderWithHeight } from "../../../src/shaders/dot-shader-with-height";

export class PerlinLinesApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    seed: number;
    perlin: Perlin;
    dots!: MultiVector3;

    // render
    camera: Camera;
    drRed: DotShaderWithHeight;
    lrGrid: LineShader;
    lrRed: LineShader;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, -2, true);
        this.camera.setState([21.919, -0.26769, -16.72, -10, 0.9, 1.5700000000000014]);

        this.perlin = Perlin.new();
        this.seed = Random.randomSeed();

        this.drRed = new DotShaderWithHeight(gl, 15, [1, 0, 0, 1], 5, false);
        this.lrGrid = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.lrRed = new LineShader(gl, [1, 0, 0, 1]);
    }

    ui(ui: UI) {
        this.params.push(Parameter.new("count", 10, 2, 500, 1));
        this.params.push(Parameter.new("displace", 0, 0, 1, 0.001));
        this.params.push(Parameter.newBoolean("perlin move", true));
        this.params.push(Parameter.new("perlin amp", 5, 1, 10, 0.01));
        this.params.push(Parameter.new("perlin speed", 2.5, 0.5, 10, 0.1));

        ui.addParameter(this.params[0], this.start.bind(this));
        ui.addParameter(this.params[1], this.start.bind(this));
        ui.addBooleanParameter(this.params[2], this.start.bind(this));
        ui.addParameter(this.params[3], this.start.bind(this));
        ui.addParameter(this.params[4], this.start.bind(this));
    }

    start() {
        // create a base grid
        this.startGrid();

        // get all parameters
        let degree = this.params[0].get();
        let displace = this.params[1].get();

        // get some points
        let rng = Random.fromSeed(this.seed);
        let vecs3 = Domain2.fromRadius(11)
            .spawn(degree + 1, degree + 1)
            .to3D()
            .forEach((v) => {
                return v.add(Vector3.fromRandomUnit(rng).scale(displace));
            });

        // save them, and put them in the renderer, which we need if we are not updating for perlin effect
        this.dots = vecs3;
        this.drRed.set(vecs3, DrawSpeed.StaticDraw);
    }

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY(), 100, 2);
        this.lrGrid.set(grid, DrawSpeed.StaticDraw);
    }

    update(state: InputState) {
        this.camera.update(state);

        let perlinMove = this.params[2].get() == 1;
        if (perlinMove) {
            let factor = this.params[3].get();
            let speed = this.params[4].get();
            let news = MultiVector3.new(this.dots.count);
            for (let i = 0; i < this.dots.count; i++) {
                let v = this.dots.get(i);
                let n = this.perlin.noise(v.x, v.y, state.newTime * 0.0001 * speed) * factor;
                v.z = n;
                news.set(i, v);
            }
            // this.drRed.set(news, DrawSpeed.DynamicDraw);

            // NEW : create lines from the points
            // let lines: MultiLine[] = [];
            // let length = Math.sqrt(this.dots.count);
            // for (let row = 0; row < length - 1; row++) {
            //     let dots = news.takeRange(row * length, (row + 1) * length);
            //     let spline = Spline.new(dots, 3)!;
            //     lines.push(spline.buffer(3));
            // }
            this.lrRed.set(Spline.new(news, 1)!.buffer(100), DrawSpeed.DynamicDraw);
        }
    }

    draw(gl: WebGLRenderingContext) {
        let c = new Context(this.camera);

        this.drRed.render(c);
        this.lrGrid.render(c);
        this.lrRed.render(c);
    }
}
