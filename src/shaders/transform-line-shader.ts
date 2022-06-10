// name:    simple-line-renderer.ts
// author:  Jos Feenstra
// purpose: WebGL based rendering of lines.

import { Matrix4 } from "../math/matrix";
import { ShaderMesh } from "../mesh/shader-mesh";
import { Context } from "../render/context";
import { Shader, DrawSpeed } from "../render/shader";

export class TransformLineShader extends Shader<ShaderMesh> {
    private a_position: number;
    private a_position_buffer: WebGLBuffer;
    private index_buffer: WebGLBuffer;
    private u_transform: WebGLUniformLocation;
    private u_color: WebGLUniformLocation;
    private count: number;
    private vertCount: number;
    private u_personal: WebGLUniformLocation;

    private personal: Matrix4;
    private color: number[];

    constructor(gl: WebGLRenderingContext, color = [1, 0, 0, 0.5]) {
        // note: I like vertex & fragments to be included in the script itself.
        // when you change vertex or fragment, this class has to deal with it.
        // putting them somewhere else doesnt make sense to me,
        // they are coupled 1 to 1.
        const vs = `
        precision mediump int;
        precision mediump float;

        attribute vec4 a_position;
        uniform mat4 u_transform;
        uniform mat4 u_personal;
        uniform vec4 u_color;

        void main() {
            gl_Position = u_transform * u_personal * a_position;
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
        this.u_personal = gl.getUniformLocation(this.program, "u_personal")!;
        this.u_color = gl.getUniformLocation(this.program, "u_color")!;

        // we need 2 buffers
        this.a_position = gl.getAttribLocation(this.program, "a_position");

        this.a_position_buffer = gl.createBuffer()!;
        this.index_buffer = gl.createBuffer()!;

        // set uniforms which wont change
        gl.useProgram(this.program);

        this.count = 0;
        this.vertCount = 0;

        this.personal = Matrix4.newIdentity();
        this.color = color;
    }

    static new(gl: WebGLRenderingContext, color = [1, 0, 0, 0.5]) {
        return new TransformLineShader(gl, color);
    }

    set(data: ShaderMesh, speed = DrawSpeed.StaticDraw) {
        // save how many faces need to be drawn
        let gl = this.gl;
        let links;
        let verts;

        // extract
        verts = data.mesh.verts;
        links = data.mesh.toLines().links.getData();
        this.personal = data.position;
        this.color = data.linecolor;

        // set it
        gl.useProgram(this.program);
        this.count = links.length;
        this.vertCount = verts.slice().width;
        let drawspeed = this.convertDrawSpeed(speed);

        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
        gl.enableVertexAttribArray(this.a_position);
        gl.vertexAttribPointer(this.a_position, this.vertCount, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, verts.slice().data, drawspeed);

        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, links.buffer, drawspeed);
    }

    render(c: Context) {
        let gl = this.gl;
        let matrix = c.camera.totalMatrix;
        // Tell it to use our program (pair of shaders)
        // POINTERS MUST ALSO BE SET, DO EVERYTHING EXCEPT GL.BUFFERDATA
        gl.useProgram(this.program);

        //
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
        gl.enableVertexAttribArray(this.a_position);
        gl.vertexAttribPointer(this.a_position, this.vertCount, gl.FLOAT, false, 0, 0);

        //
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
        gl.uniform4f(this.u_color, this.color[0], this.color[1], this.color[2], this.color[3]);

        // set uniforms
        gl.uniformMatrix4fv(this.u_transform, false, matrix.data);
        gl.uniformMatrix4fv(this.u_personal, false, this.personal.data);

        // Draw the point.
        gl.drawElements(gl.LINES, this.count, gl.UNSIGNED_SHORT, 0);
    }
}
