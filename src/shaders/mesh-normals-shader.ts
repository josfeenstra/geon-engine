// name:    simple-line-renderer.ts
// author:  Jos Feenstra
// purpose: WebGL based rendering of lines.

import {
    Shader,
    ShaderMesh,
    DrawSpeed,
    MultiVector3,
    NormalKind,
    Vector3,
    getDefaultIndices,
    Context,
} from "../lib";

export class NormalShader extends Shader<ShaderMesh> {
    a_position: number;
    a_position_buffer: WebGLBuffer;
    index_buffer: WebGLBuffer;

    u_transform: WebGLUniformLocation;

    count: number;
    vertCount: number;
    a_color_buffer: WebGLBuffer;
    a_color: number;
    scale: number;

    constructor(gl: WebGLRenderingContext) {
        // note: I like vertex & fragments to be included in the script itself.
        // when you change vertex or fragment, this class has to deal with it.
        // putting them somewhere else doesnt make sense to me,
        // they are coupled 1 to 1.
        const vs = `
        precision mediump int;
        precision mediump float;

        attribute vec4 a_vertex;
        attribute vec4 a_vertex_color;

        uniform mat4 u_transform;

        varying vec4 v_color;

        void main() {
            gl_Position = u_transform * a_vertex;
            v_color = a_vertex_color;
        }
        `;

        const fs = `
        precision mediump int;
        precision mediump float;

        varying vec4 v_color;

        void main () {
            gl_FragColor = v_color;
        }
        `;

        // setup program
        super(gl, vs, fs);
        this.u_transform = gl.getUniformLocation(this.program, "u_transform")!;

        // we need 2 buffers
        this.a_position = gl.getAttribLocation(this.program, "a_vertex");
        this.a_color = gl.getAttribLocation(this.program, "a_vertex_color");

        this.a_position_buffer = gl.createBuffer()!;
        this.a_color_buffer = gl.createBuffer()!;
        this.index_buffer = gl.createBuffer()!;

        gl.useProgram(this.program);
        this.count = 0;
        this.vertCount = 0;
        this.scale = 0.4;
    }

    // take a general render mesh, and extract normals
    set(rend: ShaderMesh, speed = DrawSpeed.StaticDraw) {
        // save how many verts need to be drawn
        let gl = this.gl;
        gl.useProgram(this.program);
        let drawspeed = this.convertDrawSpeed(speed);
        this.vertCount = 3;

        let lineverts: MultiVector3;
        let normals: MultiVector3;

        // different buffer fills based upon normal kind
        let normalKind = rend.getNormalType();
        if (normalKind == NormalKind.Face) {
            let faceCount = rend.mesh.links.count();
            this.count = faceCount * 2;

            lineverts = MultiVector3.new(this.count);
            normals = MultiVector3.new(this.count);

            for (let f = 0; f < faceCount; f++) {
                let center = rend.getFaceVertices(f).average();
                let normal = rend.norms.get(f);
                let i1 = f * 2;
                let i2 = f * 2 + 1;

                lineverts.set(i1, center);
                lineverts.set(i2, center.add(normal.scaled(this.scale)));
                let color = normal.add(new Vector3(1, 1, 1).div(2));
                normals.set(i1, color);
                normals.set(i2, color);
            }
        } else if (normalKind == NormalKind.Vertex) {
            let vertCount = rend.mesh.verts.count;
            this.count = vertCount * 2;

            lineverts = MultiVector3.new(this.count);
            normals = MultiVector3.new(this.count);

            for (let i = 0; i < vertCount; i++) {
                let center = rend.mesh.verts.get(i);
                let normal = rend.norms.get(i);
                let i1 = i * 2;
                let i2 = i * 2 + 1;

                lineverts.set(i1, center);
                lineverts.set(i2, center.add(normal.scaled(this.scale)));

                let color = normal.add(new Vector3(1, 1, 1)).div(2);
                normals.set(i1, color);
                normals.set(i2, color);
            }
            // console.log(normals);
        } else {
            // console.warn("no normals for type", normalKind);
            this.count = 0;
            return;
        }

        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
        gl.enableVertexAttribArray(this.a_position);
        gl.vertexAttribPointer(this.a_position, this.vertCount, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, lineverts.slice().data, drawspeed);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_color_buffer);
        gl.enableVertexAttribArray(this.a_color);
        gl.vertexAttribPointer(this.a_color, this.vertCount, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, normals.slice().data, drawspeed);

        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, getDefaultIndices(this.count), drawspeed);
    }

    render(c: Context) {
        let gl = this.gl;
        let matrix = c.camera.totalMatrix;
        let camera = c.camera;

        // Tell it to use our program (pair of shaders)
        // POINTERS MUST ALSO BE SET, DO EVERYTHING EXCEPT GL.BUFFERDATA
        gl.useProgram(this.program);

        // buffer 1
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
        gl.enableVertexAttribArray(this.a_position);
        gl.vertexAttribPointer(this.a_position, this.vertCount, gl.FLOAT, false, 0, 0);

        // buffer 2
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_color_buffer);
        gl.enableVertexAttribArray(this.a_color);
        gl.vertexAttribPointer(this.a_color, this.vertCount, gl.FLOAT, false, 0, 0);

        // index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);

        // set uniforms
        gl.uniformMatrix4fv(this.u_transform, false, matrix.data);

        // Draw the point.
        gl.drawElements(gl.LINES, this.count, gl.UNSIGNED_SHORT, 0);
    }
}
