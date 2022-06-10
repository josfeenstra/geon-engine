// webgl-helpers.ts
//
// author: Jos Feenstra
// credits to : https://webglfundamentals.org/
// note: im still figuring out how to organize this
// TODO: remove all the WebGl wrappers

import { ShaderMesh } from "../mesh/shader-mesh";
import { Camera } from "./camera";
import { Context } from "./context";

// import { Scene } from "./scene";

var nextTextureId = 0;
var rendercallsperframe = 0;

export type WebGl = WebGLRenderingContext;


export enum DrawSpeed {
    StaticDraw, // if you plan on using the 'set' method only a couple of times / once
    DynamicDraw, // if you plan on using the 'set' method every frame
}

// @param T = data to feed the renderer at 'set'
export abstract class Shader<T> {
    gl: WebGLRenderingContext;
    program: WebGLProgram;

    constructor(gl: WebGLRenderingContext, vertexScript: string, fragmentScript: string) {
        this.gl = gl;
        this.program = Shader.createProgramFromScripts(gl, vertexScript, fragmentScript);
    }

    abstract set(r: T, speed: DrawSpeed): void;

    abstract render(context: Context): void;

    setAndRender(r: T, context: Context) {
        this.set(r, DrawSpeed.DynamicDraw);
        this.render(context);
    }

    // helpers. these could live somewhere else... maybe in Context?
    //#region

    static getNextTextureID() {
        let id = nextTextureId;
        nextTextureId += 1;
        return id;
    }

    static resizeCanvas(gl: WebGLRenderingContext) {
        // Lookup the size the browser is displaying the canvas in CSS pixels.
        let canvas = gl.canvas as HTMLCanvasElement;

        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;

        // Check if the canvas is not the same size.
        const needResize = gl.canvas.width !== displayWidth || gl.canvas.height !== displayHeight;

        if (needResize) {
            // Make the canvas the same size
            gl.canvas.width = displayWidth;
            gl.canvas.height = displayHeight;
        }

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        return needResize;
    }

    convertDrawSpeed(speed: DrawSpeed): number {
        if (speed == DrawSpeed.DynamicDraw) {
            return this.gl.DYNAMIC_DRAW;
        } else {
            return this.gl.STATIC_DRAW;
        }
    }

    static initWebglContext(canvas: HTMLCanvasElement, blend=false) {
        let possiblyGl = canvas.getContext("webgl");
        if (possiblyGl == undefined) {
            console.log("webgl unavailable...");
        }
        
        let gl = possiblyGl!;
        gl.enable(gl.CULL_FACE);

        if (blend) {
            gl.enable(gl.BLEND);
            gl.disable(gl.DEPTH_TEST);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        } else {
            gl.disable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1);

        return gl;
    }

    static compileShader(
        gl: WebGLRenderingContext,
        shaderSource: string,
        shaderType: number,
    ): WebGLShader {
        let shader = gl.createShader(shaderType)!;
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!success) {
            throw "could not compile shader:" + shaderSource + gl.getShaderInfoLog(shader);
        }
        return shader;
    }

    static createProgram(
        gl: WebGLRenderingContext,
        vertexShader: WebGLShader,
        fragmentShader: WebGLShader,
    ) {
        let program = gl.createProgram()!;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        let success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!success) {
            throw "program failed to link:" + gl.getProgramInfoLog(program);
        }
        return program;
    }

    static createProgramFromScripts(
        gl: WebGLRenderingContext,
        vertexScript: string,
        fragmentScript: string,
    ): WebGLProgram {
        let vertexShader = Shader.compileShader(gl, vertexScript, gl.VERTEX_SHADER);
        let fragmentShader = Shader.compileShader(gl, fragmentScript, gl.FRAGMENT_SHADER);
        return Shader.createProgram(gl, vertexShader, fragmentShader);
    }

    //#endregion
}
