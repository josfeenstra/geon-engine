// purpose: demonstrate new renderer capabilities

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
    Domain3,
    Polyline,
} from "../../../src/lib";
import { Random } from "../../../src/math/random";
import { MultiRenderer } from "../../../src/render/multi-renderer";
import { DotShaderWithHeight } from "../../../src/shaders/dot-shader-with-height";

export class MultiRendererApp extends App {
    
    // ui
    params: Parameter[] = [];

    // state
    points!: MultiVector3;

    // render
    camera: Camera;
    mr: MultiRenderer;
    gs: LineShader; 
    rng!: Random;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        // setup the render environment 
        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, -2, true);
        this.camera.set(-2, 1, 1);
        this.gs = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.mr = MultiRenderer.new(gl);
    }

    start() {
        this.startGrid();
        this.rng = Random.fromSeed(10394);

        // render a bunch of dots
        this.points = Domain3.fromRadius(5).populate(100, this.rng);
        this.mr.set(this.points, "dots");

        // render a line
        let lines = Polyline.new(this.points);
        this.mr.set(lines);
        
        // render a plane at each point
        this.points.forEach(v => this.mr.set(Plane.WorldXZ().moveTo(v)));
    }

    ui(ui: UI) {}

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY().moveTo(new Vector3(0, 0, -1)), 100, 2);
        this.gs.set(grid, DrawSpeed.StaticDraw);
    }

    update(state: InputState) {
        this.camera.update(state);

        this.points.forEach(v => v.add(Vector3.fromRandomUnit(this.rng)))        
        this.mr.set(this.points, "dots");
    }

    draw(gl: WebGLRenderingContext) {
        const canvas = gl.canvas as HTMLCanvasElement;
        let matrix = this.camera.totalMatrix;
        let c = new Context(this.camera);
        this.gs.render(c);
        this.mr.render(c);
    }
}
