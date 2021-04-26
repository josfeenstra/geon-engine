import {
    Combo,
    GeonImage,
    Renderable,
    TextureMeshRenderer,
    Rectangle3,
    Plane,
    Vector3,
    Domain2,
    Mesh,
    Context,
} from "../lib";
import { Matrix4 } from "../math/matrix";
import { DrawSpeed } from "../render/renderer";
import { MeshDebugRenderer } from "../renderers/mesh-debug-renderer";
import { TransformLineRenderer } from "../renderers/transform-line-renderer";
import { TransformMeshRenderer } from "../renderers/transform-mesh-renderer";

export class StaticMeshCombo extends Combo<Mesh, Renderable, TransformLineRenderer> {
    color: number[];
    linecolor: number[];
    renderer2: TransformMeshRenderer;

    private constructor(gl: WebGLRenderingContext) {
        super(gl, Mesh.newEmpty(0, 0, 0), TransformLineRenderer.new);
        this.color = [0, 0, 0, 0.8];
        this.linecolor = [0.3, 0.3, 0.3, 1];
        this.renderer2 = new TransformMeshRenderer(gl);
    }

    static new(gl: WebGLRenderingContext): StaticMeshCombo {
        return new StaticMeshCombo(gl);
    }

    set(mesh: Mesh) {
        this.state = mesh;
        this.buffer();
    }

    // how to convert from state to buffered
    buffer() {
        this.buffered = this.state.toRenderable();
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

    render(context: Context) {
        this.renderer2.render(context);
        this.renderer.render(context);
    }
}