// Author: Jos Feenstra
// Purpose: The Core app. This can hold multiple other apps with their own Update and Draw calls.
// Use this to switch between Apps, or run multiple Apps.

import { InputState } from "./input-state";
import { App } from "../app/app";
import { FpsCounter } from "./fps-counter";
import { UI } from "./ui";
import { Shader } from "../render/shader";

export class Core {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    state: InputState;
    ui: UI;
    fpsCounter: FpsCounter;

    fullscreen = true;
    fpsInTitle = true;

    private apps: Map<string, App>;

    constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext, uiFrame: HTMLDivElement) {
        this.canvas = canvas;
        this.gl = gl;
        this.state = new InputState(canvas);
        this.fpsCounter = new FpsCounter();
        this.ui = new UI(uiFrame);
        this.apps = new Map();
    }

    // todo: cycle through apps
    addApp(app: App) {
        this.apps.set(app.name, app);
        this.activateApp(app);
    }

    removeApp(appName: string) {
        this.ui.removeContext(appName);
        this.apps.delete(appName);
    }

    activateApp(app: App) {
        this.ui.addContext(app.name);
        this.ui.addText(app.description);
        app.ui(this.ui);
        app.start();
    }

    update(time: number) {
        this.state.preUpdate(time);
        this.fpsCounter.update(this.state);
        this.apps.forEach((app) => {
            app.update(this.state);
        });
        this.state.postUpdate();
    }

    draw() {
        const canvas = this.canvas;
        const gl = this.gl;

        // put fps in the title
        if (this.fpsInTitle) {
            document.title = "fps: " + this.fpsCounter.getFps();
        }

        if (this.fullscreen) {
            // pre-gl business
            if (window.innerHeight != canvas.height || window.innerWidth != canvas.width) {
                canvas.height = window.innerHeight;
                // canvas.clientHeight = window.innerHeight;
                canvas.style.height = window.innerHeight.toString();

                canvas.width = window.innerWidth;
                // canvas.clientWidth = window.innerWidth;
                canvas.style.width = window.innerWidth.toString();

                gl.viewport(0, 0, window.innerWidth, window.innerHeight);
            }
        } else {
        }

        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // render all apps
        // TODO : reverse order
        this.apps.forEach((app) => {
            app.draw(this.gl);
        });
    }
}
