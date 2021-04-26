// name:    mesh-renderer.ts
// author:  Jos Feenstra
// purpose: WebGL based rendering of a mesh.

import { IntMatrix } from "../data/int-matrix";
import { LineArray } from "../mesh/line-array";
import { Vector3Array } from "../data/vector-array";
import { Renderable } from "../mesh/render-mesh";
import { Matrix4 } from "../math/matrix";
import { DrawSpeed, Renderer } from "../render/renderer";
import { LineRenderer } from "./line-renderer";
import { SimpleMeshRenderer } from "./simple-mesh-renderer";
import { NormalRenderer } from "./mesh-normals-renderer";
import { Camera } from "../render/camera";
import { DotRenderer3 } from "./dot-renderer3";
import { Graph } from "../mesh/graph";
import { Context } from "../render/context";
import { MetaRenderer } from "../render/meta-renderer";

export class GraphDebugRenderer extends MetaRenderer<Graph> {
    faceRend: SimpleMeshRenderer;
    lineRend: LineRenderer;
    pointRend: DotRenderer3;
    normRend?: NormalRenderer;

    constructor(
        gl: WebGLRenderingContext,
        faceColor = [1, 0, 0, 0.25],
        edgeColor = [1, 0, 0, 1],
        renderNormal = true,
    ) {
        super();
        this.faceRend = new SimpleMeshRenderer(gl, faceColor);
        this.lineRend = new LineRenderer(gl, edgeColor);
        this.pointRend = new DotRenderer3(gl, 7, edgeColor, false);
        if (renderNormal) this.normRend = new NormalRenderer(gl);
    }

    set(graph: Graph, speed: DrawSpeed = DrawSpeed.StaticDraw) {
        //this.faceRend.setMesh(gl, mesh);

        this.pointRend.set(graph.allVertPositions(), speed);
        this.lineRend.set(graph.toLines(), speed);
        // this.normRend?.setWithLists(graph.allVertPositions(), graph.allNorms(), speed);
    }

    // render 1 image to the screen
    render(c: Context) {
        this.pointRend.render(c);
        // this.faceRend.render(gl, camera.totalMatrix);
        this.lineRend.render(c);
        // this.normRend?.render(gl, camera);
    }

    setAndRender(r: Graph, context: Context): void {
        throw new Error("Method not implemented.");
    }
}