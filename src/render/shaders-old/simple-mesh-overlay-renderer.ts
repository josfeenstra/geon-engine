// name:    mesh-renderer.ts
// author:  Jos Feenstra
// purpose: WebGL based rendering of a mesh.

import { ShaderMesh } from "../../lib";
import { Scene } from "../../lib";
import { DrawSpeed } from "../webgl/HelpGl";
import { OldShader } from "../OldShader";

/**
 * Draw a mesh on top of all other meshes
 */
export class SimpleMeshOverlayRenderer extends OldShader<ShaderMesh> {
    // attribute & uniform locations
    a_position: number;
    a_position_buffer: WebGLBuffer;
    index_buffer: WebGLBuffer;
    u_transform: WebGLUniformLocation;
    u_color: WebGLUniformLocation;
    count: number;
    size: number;

    constructor(gl: WebGLRenderingContext, color = [1, 0, 0, 0.25], forcedZ=0.0001) {
        const vs = `
        precision mediump int;
        precision mediump float;

        attribute vec4 a_position;
        uniform mat4 u_transform;
        uniform vec4 u_color;

        void main() {
            gl_Position = u_transform * a_position;
            gl_Position.z = ${forcedZ};
        }
        `;

        const fs = `
        precision mediump int;
        precision mediump float;

        uniform vec4 u_color;

        void main () {
            gl_FragColor = u_color;
        }
        `;

        // setup program
        super(gl, vs, fs);

        this.u_transform = gl.getUniformLocation(this.program, "u_transform")!;
        this.u_color = gl.getUniformLocation(this.program, "u_color")!;

        gl.useProgram(this.program);
        gl.uniform4f(this.u_color, color[0], color[1], color[2], color[3]);
        this.count = 0;
        this.size = 0;

        // we need 2 buffers
        // -> 1 float buffer for the positions of all vertices.
        // -> 1 int buffer for the index of all triangles
        this.a_position = gl.getAttribLocation(this.program, "a_position");
        this.a_position_buffer = gl.createBuffer()!;
        this.index_buffer = gl.createBuffer()!;
    }

    set(rend: ShaderMesh, speed: DrawSpeed = DrawSpeed.StaticDraw) {
        let gl = this.gl;
        let mesh = rend.mesh;

        // save how many faces need to be drawn
        gl.useProgram(this.program);
        this.count = mesh.links.data.length;

        // color
        let color = rend.color;
        gl.uniform4f(this.u_color, color[0], color[1], color[2], color[3]);

        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
        this.size = 3;
        var type = gl.FLOAT;
        var normalize = false;
        gl.vertexAttribPointer(this.a_position, this.size, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.verts.slice().data, speed);

        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.links.data, speed);
    }

    // render 1 image to the screen
    render(c: Scene) {
        let gl = this.gl;
        let matrix = c.camera.totalMatrix;

        // Tell it to use our program (pair of shaders)
        gl.useProgram(this.program);
        gl.enableVertexAttribArray(this.a_position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
        gl.vertexAttribPointer(this.a_position, this.size, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);

        // set uniforms
        gl.uniformMatrix4fv(this.u_transform, false, matrix.data);

        // Draw the point.
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }

    setAndRender(r: ShaderMesh, context: Scene): void {
        this.set(r, DrawSpeed.DynamicDraw);
        this.render(context);
    }
}
