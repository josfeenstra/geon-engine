//

import { Vector2, Vector3 } from "../math/vector";
import { Parameter } from "../system/ui";

// css classes
const DUO_WRAPPER = "duo-param-wrapper";
const DUO_HEADER = "duo-param-header";
const DUO_BODY = "duo-param-body";
// const DUO_SLIDER_HOR    = "duo-param-hor";
// const DUO_SLIDER_VER    = "duo-param-ver";
const DUO_CANVAS = "duo-param-canvas";

export class DuoParameter {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    x: Parameter;
    y: Parameter;
    state: Vector2; // state in parameter space

    constructor(canvas: HTMLCanvasElement, x: Parameter, y: Parameter) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.x = x;
        this.y = y;
        this.state = Vector2.new();
        this.start();
    }

    static new(canvas: HTMLCanvasElement, x: Parameter, y: Parameter): DuoParameter {
        return new DuoParameter(canvas, x, y);
    }

    static newFromImage(image: ImageData) {
        // return this.new()
    }

    start() {
        // set listeners
        this.canvas.addEventListener("mouseenter", (e: MouseEvent) => {
            this.updateState(e);
            this.updateDraw();
            console.log("on canvas!");
        });

        this.canvas.addEventListener("mousemove", (e: MouseEvent) => {
            this.updateState(e);
            this.updateDraw();
        });

        this.canvas.addEventListener("mouseleave", () => {
            console.log("on leave!");
        });
    }

    // the mouse is moving on the canvas, update everything accordingly
    updateState(e: MouseEvent) {
        var x = e.offsetX; // - e.offsetX; //x position within the element.
        var y = e.offsetY; // - e.offsetY; //y position within the element.

        this.x.set(x, false);
        this.y.set(y, false);

        if (e) {
            this.state.set(x, y);
        }

        // console.log("mouse is at", x, y);
        // if (e.but) this.state.set(x, y);
    }

    updateDraw() {
        let ctx = this.ctx;
        let width = this.canvas.width;
        let height = this.canvas.height;
        this.ctx.clearRect(0, 0, width, height);
        drawCircle(ctx, this.state, 5, "red");
    }

    toHtml(): HTMLDivElement {
        let div = new HTMLDivElement();
        div.className = DUO_WRAPPER;

        div.innerHTML = `
            <p class=${DUO_HEADER}></p>
            <canvas class=${DUO_CANVAS}></canvas>
        `;

        return div;
    }
}

function drawCircle(ctx: CanvasRenderingContext2D, pos: Vector2, radius: number, fill = "white") {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
}
