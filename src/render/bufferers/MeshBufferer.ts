import { DrawSpeed } from "../../lib";
import { Matrix4 } from "../../math/Matrix4";
import { Mesh } from "../../geometry/mesh/Mesh";
import { ShaderMesh } from "../../geometry/mesh/ShaderMesh";
import { Scene } from "../../lib";
import { TransformLineShader } from "../shaders-old/transform-line-shader";
import { TransformMeshShader } from "../shaders-old/transform-mesh-shader";
import { Bufferer } from "../basics/Bufferer";

export class MeshBufferer extends Bufferer<Mesh, ShaderMesh, TransformLineShader> {
    color: number[];
    linecolor: number[];
    renderer2: TransformMeshShader;

    private constructor(gl: WebGLRenderingContext) {
        super(gl, Mesh.newEmpty(0, 0, 0), TransformLineShader.new);
        this.color = [0, 0, 0, 0.8];
        this.linecolor = [0.3, 0.3, 0.3, 1];
        this.renderer2 = new TransformMeshShader(gl);
    }

    static new(gl: WebGLRenderingContext): MeshBufferer {
        return new MeshBufferer(gl);
    }

    set(mesh: Mesh) {
        this.state = mesh;
        this.buffer();
    }

    // how to convert from state to buffered
    buffer() {
        this.buffered = this.state.ToShaderMesh();
        this.buffered.calculateFaceNormals();
        this.buffered.color = this.color;
        this.buffered.linecolor = this.linecolor;
        this.commit();
    }

    commit() {
        this.buffered.color = this.color;
        this.buffered.linecolor = this.linecolor;
        this.renderer.set(this.buffered, DrawSpeed.StaticDraw);
        this.renderer2.set(this.buffered, DrawSpeed.StaticDraw);
    }

    render(scene: Scene) {
        this.renderer2.render(scene);
        this.renderer.render(scene);
    }
}
