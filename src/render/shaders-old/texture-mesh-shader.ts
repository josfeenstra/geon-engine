// name:    mesh-renderer.ts
// author:  Jos Feenstra
// purpose: WebGL based rendering of a mesh.

import { ShaderMesh, Scene, Mesh, Bitmap } from "../../lib";
import { HelpGl, DrawSpeed } from "../webgl/HelpGl";
import { OldShader } from "../OldShader";
import { isPowerOf2 } from "../webgl/UniformTexture";

export class TextureMeshShader extends OldShader<ShaderMesh> {
    // attribute & uniform locations
    a_position: number;
    a_position_buffer: WebGLBuffer;
    index_buffer: WebGLBuffer;

    u_transform: WebGLUniformLocation;
    // u_texture: WebGLUniformLocation;

    count: number;
    size: number;
    a_texcoord: number;
    a_texcoord_buffer: WebGLBuffer;
    u_texture: WebGLUniformLocation;
    texture_id: number;
    texture: WebGLTexture | null;
    u_texture_size: WebGLUniformLocation;

    constructor(gl: WebGLRenderingContext, pixelPerfect = true, forcedZ?: number) {
        const vs = `
        // precision mediump int;
        // precision mediump float;

        attribute vec4 a_position;
        attribute vec2 a_texcoord;

        uniform mat4 u_transform;

        varying vec2 v_texcoord;

        void main() {
            gl_Position = u_transform * a_position;
            v_texcoord = a_texcoord;
            ${forcedZ ? `gl_Position.z = ${forcedZ.toPrecision(3)};` : ``} 
        }
        `;

        let fs;
        if (pixelPerfect) {
            fs = `
            precision mediump float;
    
            varying vec2 v_texcoord;

            uniform vec2 u_texture_size;
            uniform sampler2D u_texture;
    
            // make pixel-perfect, but round it so it has no artefacts.
            vec2 snapPixel(vec2 uv, vec2 size, vec2 alpha) {
                vec2 pixel_uv = uv * size;
                vec2 x = fract(pixel_uv);
                vec2 x_ = clamp(0.5 / alpha * x, 0.0, 0.5) +
                          clamp(0.5 / alpha * (x - 1.0) + 0.5, 0.0, 0.5);
                return clamp((floor(pixel_uv) + x_) / size, 0.0, 0.9999);
            } 

            void main() {
                vec2 coord = snapPixel(v_texcoord, u_texture_size, vec2(0.02));
                gl_FragColor = texture2D(u_texture, coord);
            }
            `;
        } else {
            fs = `
            precision mediump float;
    
            varying vec2 v_texcoord;
    
            uniform vec2 u_texture_size;
            uniform sampler2D u_texture;
    
            void main() {
                gl_FragColor = texture2D(u_texture, v_texcoord);
            }
            `;
        }

        // setup program
        super(gl, vs, fs);
        gl.useProgram(this.program);
        this.count = 0;
        this.size = 0;

        // init uniforms
        this.u_transform = gl.getUniformLocation(this.program, "u_transform")!;
        this.u_texture_size = gl.getUniformLocation(this.program, "u_texture_size")!;
        this.u_texture = gl.getUniformLocation(this.program, "u_texture")!;

        // init three buffers: verts | uvs | links
        this.a_position = gl.getAttribLocation(this.program, "a_position");
        this.a_position_buffer = gl.createBuffer()!;

        this.a_texcoord = gl.getAttribLocation(this.program, "a_texcoord");
        this.a_texcoord_buffer = gl.createBuffer()!;

        this.index_buffer = gl.createBuffer()!;

        // init texture
        this.texture_id = HelpGl.getNextTextureID();
        this.texture = gl.createTexture();
    }

    static new(gl: WebGLRenderingContext, pixelPerfect = true): TextureMeshShader {
        return new TextureMeshShader(gl, pixelPerfect);
    }

    set(r: ShaderMesh, speed: DrawSpeed) {
        let gl = this.gl;

        if (!r.texture) {
            console.warn("Mesh does not contain a texture!");
            return;
        }

        // save how many faces need to be drawn
        gl.useProgram(this.program);
        this.count = r.mesh.links.data.length;

        // buffer 1
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
        gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, r.mesh.verts.matrix.data, speed);

        // buffer 2
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_texcoord_buffer);
        gl.vertexAttribPointer(this.a_texcoord, 2, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, r.uvs.data, speed);

        // buffer 3
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(r.mesh.links.data), speed);

        // texture
        gl.activeTexture(gl.TEXTURE0 + this.texture_id);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, r.texture);
        gl.uniform2f(this.u_texture_size, r.texture.width, r.texture.height);
        // alternative texture -> Fill the texture with a 1x1 blue pixel.
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 128, 128, 255]));
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, mesh.texture.data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    setWithMesh(mesh: Mesh, texture: Bitmap, speed: DrawSpeed) {
        let gl = this.gl;

        // save how many faces need to be drawn
        gl.useProgram(this.program);
        this.count = mesh.links.data.length;

        // buffer 1
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
        gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.verts.slice().data, speed);

        // buffer 2
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_texcoord_buffer);
        gl.vertexAttribPointer(this.a_texcoord, 2, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs!.toMatrixSlice().data, speed);

        // buffer 3
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.links.data), speed);

        // texture
        gl.activeTexture(gl.TEXTURE0 + this.texture_id);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texture.width, texture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, texture.data);
        gl.uniform2f(this.u_texture_size, texture.width, texture.height);
        // alternative texture -> Fill the texture with a 1x1 blue pixel.
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 128, 128, 255]));
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, mesh.texture.data);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);

        if (isPowerOf2(texture.width) && isPowerOf2(texture.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    }

    render(context: Scene) {
        let gl = this.gl;
        let camera = context.camera;
        let matrix = camera.totalMatrix;
        // console.log("rendering..");

        // use the program
        gl.useProgram(this.program);

        // set uniforms
        gl.uniformMatrix4fv(this.u_transform, false, matrix.data);

        // set texture
        gl.uniform1i(this.u_texture, this.texture_id);
        gl.activeTexture(gl.TEXTURE0 + this.texture_id);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // buffer 1
        gl.enableVertexAttribArray(this.a_position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_position_buffer);
        gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, false, 0, 0);

        // buffer 2
        gl.enableVertexAttribArray(this.a_texcoord);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.a_texcoord_buffer);
        gl.vertexAttribPointer(this.a_texcoord, 2, gl.FLOAT, false, 0, 0);

        // buffer 3
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);

        // draw!
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }

    setAndRender(r: ShaderMesh, context: Scene) {
        this.set(r, DrawSpeed.DynamicDraw);
        this.render(context);
    }
}
