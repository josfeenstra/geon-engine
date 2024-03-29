// Purpose: I was getting sick of dealing with separate widths, buffers & positions, even though these values are tied together :)

import { DrawElementsType } from "./Constants";
import { DrawSpeed, HelpGl, WebGl } from "./HelpGl";

/**
 * Wrapper for a webgl buffer attibute
 */
export class Attribute {
    private constructor(
        public gl: WebGl,
        public buffer: WebGLBuffer,
        public position: number,
        public width: number,
        public type: number,
    ) {}

    static new(gl: WebGl, program: WebGLProgram, name: string, matrixWidth: number) {
        let position = gl.getAttribLocation(program, name);
        if (position == -1) {
            console.error(`couldnt find attribute [${name}] within glsl! Keep in mind: webgl filters unused attributes automatically`);
        }
        let buffer = gl.createBuffer()!;
        return new Attribute(gl, buffer, position, matrixWidth, gl.FLOAT);
    }

    /**
     *  Load some new data into this attribute
     */
    load(gl: WebGl, data: BufferSource, speed: DrawSpeed) {
        // TODO experiment with switching these two
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.enableVertexAttribArray(this.position);

        gl.vertexAttribPointer(this.position, this.width, this.type, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, data, speed);
    }

    /**
     * Enable the attribute / activate it, but do not set any data
     * Must be called before rendering
     */
    bind(gl: WebGl) {
        gl.enableVertexAttribArray(this.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(this.position, this.width, this.type, false, 0, 0);
    }
}