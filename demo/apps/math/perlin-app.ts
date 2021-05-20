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
    MultiVector3,
} from "../../../src/lib";
import { Random } from "../../../src/math/random";

export class PerlinApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    seed: number;
    perlin: Perlin;
    dots!: MultiVector3;

    // render
    camera: Camera;
    drRed: DotRenderer3;
    lrGrid: LineRenderer;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, -2, true);
        this.camera.setState([16.157, 0.79017, -7.02, -10, 1.12, 1.5600000000000014]);

        this.perlin = Perlin.new();
        this.seed = Random.randomSeed();

        this.drRed = new DotRenderer3(gl, 10, [1, 0, 0, 1], false);
        this.lrGrid = new LineRenderer(gl, [0.3, 0.3, 0.3, 1]);
    }

    ui(ui: UI) {
        ui.addText("BEZIER SQUARE");

        this.params.push(Parameter.new("count", 100, 2, 500, 1));
        this.params.push(Parameter.new("displace", 0, 0, 1, 0.001));
        this.params.push(Parameter.newBoolean("perlin move", true));
        this.params.push(Parameter.new("perlin amp", 4, 1, 10, 0.01));
        this.params.push(Parameter.new("perlin speed", 1, 0.5, 5, 0.1));

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
            let news = this.dots.map((v) => {
                let n = this.perlin.noise(v.x, v.y, state.newTime * 0.0001 * speed) * factor;
                return v.added(Vector3.new(0, 0, n));
            });
            this.drRed.set(news, DrawSpeed.DynamicDraw);
        }
    }

    draw(gl: WebGLRenderingContext) {
        let c = new Context(this.camera);

        this.drRed.render(c);
        this.lrGrid.render(c);
    }
}