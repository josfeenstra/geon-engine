// name:    combo.ts
// author:  Jos Feenstra
// purpose:
// - combination of state, bufferedState, and renderer:
//
// 1.      state
//           ||
//        (buffer)
//           \/
// 2.     buffered
//           ||
//        (render)
//           \/
// 3. rendered to screen
//
// TODO: maybe find a better name, but 'combo' is quite distinct in a way
// todo: force buffering a bit more. make a way that requiers this.buffered to be filled

import {
    GeonImage,
    Renderable,
    TextureMeshRenderer,
    Rectangle3,
    Plane,
    Vector3,
    Domain2,
    Mesh,
    Camera,
} from "../lib";
import { Context } from "./context";
import { DrawSpeed, Renderer } from "./renderer";
import { MeshPickRenderer } from "../renderers/pick-renderer";

// staticcombo

// dynacombo

// multistaic combo
// Vector3 & dotrenderer

export class Combo<S, B, R extends Renderer<B>> {
    public state: S[];
    public buffered: B[] = [];
    public renderer: R;

    protected constructor(
        gl: WebGLRenderingContext,
        state: S[],
        renderConstructor: (gl: WebGLRenderingContext) => R,
    ) {
        this.state = state;
        this.buffered = [];
        this.renderer = renderConstructor(gl);
    }

    add(item: S, buffer = true) {
        this.state.push(item);
        if (buffer) {
            this.buffer();
        }
    }

    protected buffer() {}

    draw(context: Context) {
        for (let i = 0; i < this.buffered.length; i++) {
            const b = this.buffered[i];
            this.renderer.setAndRender(b, context);
        }
    }
}

// // small tie-together of data & renderer.
// // used to interact with the rendering behaviour of a renderableMesh.
// // TODO: typecheck if data & renderer are compatible

// import { Renderer, DrawSpeed } from "./renderer";
// import { Scene } from "./scene";

// // TODO add this information to the new Renderable

// export class StaticRenderUnit<R extends Renderer, D> {
//     renderer: R;
//     data: D;

//     constructor(renderer: R, data: D) {
//         this.renderer = renderer;
//         this.data = data;
//     }

//     static new<A extends Renderer, B>(renderer: A, data: B): StaticRenderUnit<A, B> {
//         return new StaticRenderUnit(renderer, data);
//     }

//     buffer() {
//         this.renderer.buffer(this.data);
//     }

//     render(context: Scene) {
//         this.renderer.render(context);
//     }
// }

// export class DynamicRenderUnit<R extends Renderer, D> {
//     renderer: R;
//     data: D;

//     constructor(renderer: R, data: D) {
//         this.renderer = renderer;
//         this.data = data;
//     }

//     static new<A extends Renderer, B>(renderer: A, data: B): DynamicRenderUnit<A, B> {
//         return new DynamicRenderUnit(renderer, data);
//     }

//     render(context: Scene) {
//         this.renderer.buffer();
//         this.renderer.render(context);
//     }
// }
