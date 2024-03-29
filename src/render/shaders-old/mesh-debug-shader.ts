// name:    mesh-renderer.ts
// author:  Jos Feenstra
// purpose: WebGL based rendering of a mesh.

import { ShaderMesh, Matrix4, MultiLine, MultiShader } from "../../lib";
import { Scene } from "../../lib";
import { DrawSpeed } from "../webgl/HelpGl";
import { LineShader } from "./line-shader";
import { NormalShader } from "./mesh-normals-shader";
import { SimpleMeshShader } from "./simple-mesh-shader";

export class MeshDebugShader extends MultiShader<ShaderMesh> {
    faceRend: SimpleMeshShader;
    lineRend: LineShader;
    normRend?: NormalShader;
    personal: Matrix4;

    constructor(
        gl: WebGLRenderingContext,
        faceColor = [1, 0, 0, 0.25],
        edgeColor = [1, 0, 0, 1],
        renderNormal = true,
    ) {
        super();
        this.faceRend = new SimpleMeshShader(gl, faceColor);
        this.lineRend = new LineShader(gl, edgeColor);
        this.personal = Matrix4.newIdentity();
        if (renderNormal) this.normRend = new NormalShader(gl);
    }

    static new(
        gl: WebGLRenderingContext,
        faceColor = [1, 0, 0, 0.25],
        edgeColor = [1, 0, 0, 1],
        renderNormal = true,
    ) {
        return new MeshDebugShader(gl, faceColor, edgeColor, renderNormal);
    }

    set(data: ShaderMesh, speed: DrawSpeed = DrawSpeed.StaticDraw) {
        this.personal = data.position;
        this.faceRend.set(data.mesh);
        this.lineRend.set(MultiLine.fromMesh(data), speed);
        this.normRend?.set(data, speed);
    }

    render(c: Scene) {
        this.faceRend.render(c);
        this.lineRend.render(c);
        this.normRend?.render(c);
    }

    setAndRender(r: ShaderMesh, c: Scene) {
        this.set(r, DrawSpeed.DynamicDraw);
        this.render(c);
    }
}
