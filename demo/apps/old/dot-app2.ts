// author : Jos Feenstra
// purpose : test with Renderers, Domains & Vectors

import { App, Vector2, Domain2, DotShader2, InputState, Context, Camera } from "../../../src/lib";
import { Random } from "../../../src/math/random";

export class DotApp2 extends App {
    dots: Vector2[] = [];
    dirs: Vector2[] = [];

    bounds: Domain2;
    renderer: DotShader2;
    context: Context;

    // unique constructors
    constructor(gl: WebGLRenderingContext) {
        super(gl);
        let canvas = gl.canvas as HTMLCanvasElement;
        this.bounds = Domain2.fromBounds(0, 500, 0, 500);
        this.renderer = new DotShader2(gl, 5, [1, 1, 1, 1], true);
        this.context = new Context(new Camera(canvas, 1, false));
    }

    start() {
        // additional setup of state
        let normrange = 5;
        let count = 10;
        let rng = Random.fromSeed(1234);
        const normSpace = Domain2.fromBounds(-normrange, normrange, -normrange, normrange);

        for (let i = 0; i < count; i++) {
            this.dots.push(this.bounds.elevate(Vector2.fromRandom(rng)));
            this.dirs.push(normSpace.elevate(Vector2.fromRandom(rng)));
        }
    }

    update(state: InputState) {
        for (let i = 0; i < this.dots.length; i++) {
            // these 'should' be pointers, but check this
            let dot = this.dots[i];
            let dir = this.dirs[i];

            // bounce of the edges
            if (!this.bounds.x.includes(dot.x)) dir.x = -dir.x;
            if (!this.bounds.y.includes(dot.y)) dir.y = -dir.y;

            dot.add(dir);

            if (state.IsKeyDown(" ")) console.log(dot);
        }
    }

    draw(gl: WebGLRenderingContext) {
        this.renderer.render(this.context);
    }
}
