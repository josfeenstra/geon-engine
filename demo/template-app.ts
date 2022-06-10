import {
    App,
    DotShader,
    LineShader,
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
} from "../src/lib";
import { MultiRenderer } from "../src/render/multi-renderer";

export class MultiRendererApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    points!: MultiVector3;
    Plsa!: MultiVector3;
    Pnormal!: MultiVector3;

    // render
    camera: Camera;
    mr: MultiRenderer;
    gs: LineShader; 
    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, -2, true);
        this.camera.set(-2, 1, 1);
        this.gs = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.mr = MultiRenderer.new(gl);
    }

    start() {
        this.startGrid();

        // create something!




    }

    ui(ui: UI) {}

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY().moveTo(new Vector3(0, 0, -1)), 100, 2);
        this.gs.set(grid, DrawSpeed.StaticDraw);
    }

    update(state: InputState) {
        this.camera.update(state);
    }

    draw(gl: WebGLRenderingContext) {
        const canvas = gl.canvas as HTMLCanvasElement;
        let matrix = this.camera.totalMatrix;
        let c = new Context(this.camera);
        this.gs.render(c);
        this.mr.render(c);
    }
}
