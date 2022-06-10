// name:    simple-line-renderer.ts
// author:  Jos Feenstra
// purpose: WebGL based rendering of lines.

import { Shader, MultiLine, Mesh, DrawSpeed, Matrix4, Context } from "../lib";

export class LineShader extends Shader<MultiLine | Mesh> {
    a_position: number;
    a_position_buffer: WebGLBuffer;
    index_buffer: WebGLBuffer;
    u_transform: WebGLUniformLocation;
    u_color: WebGLUniformLocation;
    count: number;
    vertCount: number;
    constructor(gl: WebGLRenderingContext, color = [1, 1, 1, 0.5]) {
        // note: I like vertex & fragments to be included in the script itself.
        // when you change vertex or fragment, this class has to deal with it.
        // putting them somewhere else doesnt make sense to me,
        // they are coupled 1 to 1.
        const vs = `
        precision mediump int;
        precision mediump float;

        attribute vec4 a_position;
        uniform mat4 u_transform;
        uniform vec4 u_color;

        void main() {
            gl_Position = u_transform * a_position;
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

        // we need 2 buffers
        this.a_position = gl.getAttribLocation(this.program, "a_position");

        this.a_position_buffer = gl.createBuffer()!;
        this.index_buffer = gl.createBuffer()!;

        // set uniforms which wont change
        gl.useProgram(this.program);
        gl.uniform4f(this.u_color, color[0], color[1], color[2], color[3]);
        this.count = 0;
        this.vertCount = 0;
    }

    set(data: MultiLine | Mesh, speed = DrawSpeed.StaticDraw, personal = Matrix4.newIdentity()) {
        // save how many faces need to be drawn
        let gl = this.gl;
        let links;
        let verts;
        if (data instanceof Mesh) {
            verts = data.verts.slice();
            links = data.links.getData();
        } else {
            verts = data.verts;
            links = data.links;
        }

        // console.log(links);

        gl.useProgram(this.program);
        this.count = links.length;
        this.vertCount = verts.width;
        let drawspeed = this.convertDrawSpeed(speed);

        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
        gl.enableVertexAttribArray(this.a_position);
        gl.vertexAttribPointer(this.a_position, this.vertCount, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, verts.data, drawspeed);

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

        // buffer 1
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
        gl.enableVertexAttribArray(this.a_position);
        gl.vertexAttribPointer(this.a_position, this.vertCount, gl.FLOAT, false, 0, 0);

        // index
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);

        // set uniforms
        gl.uniformMatrix4fv(this.u_transform, false, matrix.data);

        // Draw the point.
        gl.drawElements(gl.LINES, this.count, gl.UNSIGNED_SHORT, 0);
    }

    setAndRender(data: MultiLine, c: Context) {
        this.set(data, DrawSpeed.DynamicDraw);
        this.render(c);
    }
}
