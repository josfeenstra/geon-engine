// name:    mesh-renderer.ts
// author:  Jos Feenstra
// purpose: A shader wrapper for rendering shaded, textured, meshes

import {
    Shader,
    ShaderMesh,
    DrawSpeed,
    NormalKind,
    MultiVector3,
    getDefaultIndices,
    Const,
    Context,
    Matrix4,
    Vector3,
} from "../lib";

export class ShadedMeshShader extends Shader<ShaderMesh> {
    // attribute & uniform locations
    a_vertex_position: number;
    a_vertex_postition_buffer: WebGLBuffer;

    count: number;
    size: number;

    u_normal_matrix: WebGLUniformLocation;
    u_model_view_matrix: WebGLUniformLocation;
    u_projection_matrix: WebGLUniformLocation;

    a_vertex_normal: number;
    a_vertex_normal_buffer: WebGLBuffer;
    u_ambient_light: WebGLUniformLocation;
    u_dir_light_color: WebGLUniformLocation;
    u_dir_light_vector: WebGLUniformLocation;
    a_vertex_ambi: number;
    a_vertex_ambi_buffer: WebGLBuffer;

    index_buffer: WebGLBuffer;
    u_personal_matrix: WebGLUniformLocation;

    constructor(gl: WebGLRenderingContext) {
        const vs = `

        attribute vec4 a_vertex_position;
        attribute vec3 a_vertex_normal;
        attribute float a_vertex_ambi;
    
        uniform mat4 u_normal_matrix;
        uniform mat4 u_personal_matrix;
        uniform mat4 u_model_view_matrix;
        uniform mat4 u_projection_matrix;

        // should be uniforms constances
        uniform vec3 u_ambient_light;
        uniform vec3 u_dir_light_color;
        uniform vec3 u_dir_light_vector;  

        // varying vec2 v_texture_coord;
        varying vec3 v_lighting;
    
        void main(void) {

            gl_Position = u_projection_matrix * u_model_view_matrix * u_personal_matrix * a_vertex_position;
            // v_texture_coord = a_texture_coord;
        
            // Apply lighting effect
            // highpr is removed
            vec4 transformedNormal = u_normal_matrix * vec4(a_vertex_normal, 1.0);
            float directional = max(dot(transformedNormal.xyz, u_dir_light_vector), 0.0);
            v_lighting = (u_ambient_light + (u_dir_light_color * directional));
        }
        `;

        const fs = `
        precision mediump float;

        // Calculates the diffuse factor produced by the light illumination  
        // if done like this, color could look nicer
        // float diffuseFactor(vec3 normal, vec3 light_direction) {
        //     float df = dot(normalize(normal), normalize(light_direction));
        //     if (gl_FrontFacing) {
        //         df = -df;
        //     }
        //     return max(0.0, df);
        // }

        varying vec3 v_lighting;

        void main() {

            // Fragment shader output
            gl_FragColor = vec4(v_lighting, 1.0);
        }
        `;

        // setup program
        super(gl, vs, fs);

        gl.useProgram(this.program);
        this.count = 0;
        this.size = 0;

        // init uniforms
        this.u_normal_matrix = gl.getUniformLocation(this.program, "u_normal_matrix")!;
        this.u_model_view_matrix = gl.getUniformLocation(this.program, "u_model_view_matrix")!;
        this.u_projection_matrix = gl.getUniformLocation(this.program, "u_projection_matrix")!;
        this.u_personal_matrix = gl.getUniformLocation(this.program, "u_personal_matrix")!;

        // light uniforms
        this.u_ambient_light = gl.getUniformLocation(this.program, "u_ambient_light")!;
        this.u_dir_light_color = gl.getUniformLocation(this.program, "u_dir_light_color")!;
        this.u_dir_light_vector = gl.getUniformLocation(this.program, "u_dir_light_vector")!;

        // init attributes: verts | normals | ambi
        this.a_vertex_position = gl.getAttribLocation(this.program, "a_vertex_position");
        this.a_vertex_postition_buffer = gl.createBuffer()!;

        this.a_vertex_normal = gl.getAttribLocation(this.program, "a_vertex_normal");
        this.a_vertex_normal_buffer = gl.createBuffer()!;

        this.a_vertex_ambi = gl.getAttribLocation(this.program, "a_vertex_ambi");
        this.a_vertex_ambi_buffer = gl.createBuffer()!;

        this.index_buffer = gl.createBuffer()!;
    }

    set(rend: ShaderMesh, speed: DrawSpeed = DrawSpeed.StaticDraw) {
        // NOTE: processing time is longer: we use DrawArray instead of DrawElements, to deal with normals & uv data
        let gl = this.gl;
        this.setShallow(gl, rend);

        let normalType = rend.getNormalType();
        if (normalType == NormalKind.Face) {
            // save how many verts need to be drawn

            gl.useProgram(this.program);
            this.count = rend.mesh.links.data.length;
            let ds = this.convertDrawSpeed(speed);

            // convert to non-indexed verts & norms
            let verts = MultiVector3.new(this.count);
            let norms = MultiVector3.new(this.count);
            let ambi = new Float32Array(this.count);

            let faceCount = rend.mesh.links.count();
            for (let i = 0; i < rend.mesh.links.count(); i++) {
                let norm = rend.norms.get(i);
                rend.mesh.links.getRow(i).forEach((v, j) => {
                    let id = i * 3 + j;
                    verts.set(id, rend.mesh.verts.get(v));
                    norms.set(id, norm);
                    ambi[id] = 1;
                });
            }

            // buffer 1
            gl.bindBuffer(gl.ARRAY_BUFFER, this.a_vertex_postition_buffer);
            gl.vertexAttribPointer(this.a_vertex_position, 3, gl.FLOAT, false, 0, 0);
            gl.bufferData(gl.ARRAY_BUFFER, verts.slice().data.buffer, ds);

            // buffer 2
            gl.bindBuffer(gl.ARRAY_BUFFER, this.a_vertex_normal_buffer);
            gl.vertexAttribPointer(this.a_vertex_normal, 3, gl.FLOAT, false, 0, 0);
            gl.bufferData(gl.ARRAY_BUFFER, norms.slice().data.buffer, ds);

            // buffer 3
            // gl.bindBuffer(gl.ARRAY_BUFFER, this.a_vertex_ambi_buffer);
            // gl.vertexAttribPointer(this.a_vertex_ambi, 1, gl.FLOAT, false, 0, 0);
            // gl.bufferData(gl.ARRAY_BUFFER, ambi, ds);

            // index
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                getDefaultIndices(this.count),
                this.convertDrawSpeed(speed),
            );
        } else if (normalType == NormalKind.Vertex) {
            // save how many verts need to be drawn
            gl.useProgram(this.program);

            let ds = this.convertDrawSpeed(speed);

            // convert to non-indexed verts & norms
            let ambi = rend.ambi;

            let faceCount = rend.mesh.links.count();
            this.count = rend.mesh.links.data.length;
            // console.log(rend.mesh.links);

            // buffer 1
            gl.bindBuffer(gl.ARRAY_BUFFER, this.a_vertex_postition_buffer);
            gl.vertexAttribPointer(this.a_vertex_position, 3, gl.FLOAT, false, 0, 0);
            gl.bufferData(gl.ARRAY_BUFFER, rend.mesh.verts.slice().data, ds);

            // buffer 2
            gl.bindBuffer(gl.ARRAY_BUFFER, this.a_vertex_normal_buffer);
            gl.vertexAttribPointer(this.a_vertex_normal, 3, gl.FLOAT, false, 0, 0);
            gl.bufferData(gl.ARRAY_BUFFER, rend.norms.slice().data, ds);

            // buffer 3
            // gl.bindBuffer(gl.ARRAY_BUFFER, this.a_vertex_ambi_buffer);
            // gl.vertexAttribPointer(this.a_vertex_ambi, 1, gl.FLOAT, false, 0, 0);
            // gl.bufferData(gl.ARRAY_BUFFER, ambi, ds);

            // index
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, rend.mesh.links.data, ds);
        } else {
            console.log("cannot render with this normal data");
        }

        // never render more than possible
        if (this.count > Const.MAX_U16) {
            this.count = Const.MAX_U16;
            console.warn("mesh max reached.");
        }
    }

    // set only the basic elements.
    // use this to dynamicly alter things like position and color,
    // without refilling all buffers with it
    setShallow(gl: WebGLRenderingContext, rend: ShaderMesh) {
        // use the program
        gl.useProgram(this.program);

        // position
        gl.uniformMatrix4fv(this.u_personal_matrix, false, rend.position.data);

        // color
        let color = rend.color;

        // shift shadow to darker, slightly to blue
        let shadowColor = color.map((x) => x * 0.25);
        shadowColor[2] = Math.min(1, shadowColor[2] * 1.05);

        // shift bright color slightly to yellow
        let brightColor = color.map((x) => x);
        brightColor[0] = Math.min(1, brightColor[0] * 1.05);
        brightColor[1] = Math.min(1, brightColor[1] * 1.05);
        brightColor[2] = Math.min(1, brightColor[2] * 1);

        gl.uniform3fv(this.u_ambient_light, shadowColor.slice(0, 3));
        gl.uniform3fv(this.u_dir_light_color, brightColor.slice(0, 3));
    }

    // render the previous set data to the screen
    render(c: Context) {
        // console.log("rendering..");
        let gl = this.gl;
        let camera = c.camera;

        // use the program
        gl.useProgram(this.program);

        // set uniforms
        gl.uniformMatrix4fv(this.u_normal_matrix, false, Matrix4.newIdentity().data);
        gl.uniformMatrix4fv(this.u_model_view_matrix, false, camera.worldMatrix.data);
        gl.uniformMatrix4fv(this.u_projection_matrix, false, camera.projectMatrix.data);

        // set light direction
        let vec = camera.getMouseWorldRay(gl.canvas.width, gl.canvas.height, false).normal;
        gl.uniform3fv(
            this.u_dir_light_vector,
            Vector3.unitX().add(Vector3.unitY()).add(Vector3.unitZ()).normalize().toArray(),
        );

        // buffer 1
        gl.enableVertexAttribArray(this.a_vertex_position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_vertex_postition_buffer);
        gl.vertexAttribPointer(this.a_vertex_position, 3, gl.FLOAT, false, 0, 0);

        // buffer 2
        gl.enableVertexAttribArray(this.a_vertex_normal);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_vertex_normal_buffer);
        gl.vertexAttribPointer(this.a_vertex_normal, 3, gl.FLOAT, false, 0, 0);

        // buffer 3
        // gl.enableVertexAttribArray(this.a_vertex_ambi);
        // gl.bindBuffer(gl.ARRAY_BUFFER, this.a_vertex_ambi_buffer);
        // gl.vertexAttribPointer(this.a_vertex_normal, 3, gl.FLOAT, false, 0, 0);

        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);

        // draw!
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
}
