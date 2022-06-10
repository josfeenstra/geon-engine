import { InputState } from "../system/input-state";
import { UI } from "../system/ui";

export class App {
    gl: WebGLRenderingContext;
    name: string;
    description: string;

    constructor(gl: WebGLRenderingContext, des: string = "") {
        // unique constructor
        this.gl = gl;
        this.name = this.constructor.name;
        this.description = des;
    }

    ui(ui: UI) {
        // setup for UI
    }

    start() {
        // additional setup of state
    }

    update(state: InputState) {
        // updating state
    }

    draw(gl: WebGLRenderingContext) {
        // drawing state
    }
}
