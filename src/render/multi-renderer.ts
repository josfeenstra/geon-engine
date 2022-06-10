// purpose: something that is willing to create new Shaders on the fly, to render whatever it gets


import { MultiVector3 } from "../data/multi-vector-3";
import { Curve } from "../geo/curve/curve";
import { Polyline } from "../geo/curve/polyline";
import { BiSurface, Plane } from "../lib";
import { createRandomGUID } from "../math/random";
import { Mesh } from "../mesh/mesh";
import { MultiLine } from "../mesh/multi-line";
import { ShaderMesh } from "../mesh/shader-mesh";
import { DotShader } from "../shaders/dot-shader";
import { LineShader } from "../shaders/line-shader";
import { MeshDebugShader } from "../shaders/mesh-debug-shader";
import { ShadedMeshShader } from "../shaders/shaded-mesh-shader";
import { Context } from "./context";
import { Shader, WebGl } from "./shader";

// NOTE: I think this type of polymorphism is better than regular polymorphism
export type RenderableUnit = MultiVector3 | ShaderMesh | Mesh | BiSurface | Curve | Polyline | Plane | MultiLine | any;
type AcceptableShader = DotShader | ShadedMeshShader | MeshDebugShader | LineShader

export class MultiRenderer {
    
    private constructor(
        private gl: WebGl, 
        private shaders: Map<string, AcceptableShader>) {} 

    static new(gl: WebGl) : MultiRenderer {
        return new MultiRenderer(gl, new Map());
    }

    set(unit: RenderableUnit, key?: string) {

        if (!key) {
            key = createRandomGUID();
        }

        let shader = this.shaders.get(key);
        if (!shader) {
            return this.addShader(key, unit);
        }

        // If the type definitions above are set correctly
        // and if the 'add' procedure went correctly, this will work
        //@ts-ignore
        shader?.set(unit);
        return shader;
    }

    render(c: Context) {
        for (let [key, shader] of this.shaders) {
            shader.render(c);
        }
    }

    private addShader(key: string, unit: RenderableUnit) {
        let shader;
        let gl = this.gl;

        // determine the RenderableUnit type
        // rely as much on the defaults as possilbe
        if (unit instanceof MultiVector3) {
            shader = new DotShader(gl);
            shader.set(unit);
        } else if (unit instanceof ShaderMesh) {
            shader = new ShadedMeshShader(gl);
            shader.set(unit);
        } else if (unit instanceof Mesh) {
            shader = new MeshDebugShader(gl);
            let smesh = unit.ToShaderMesh();
            shader.set(smesh);
        } else if (unit instanceof BiSurface) {
            shader = new MeshDebugShader(gl);
            let smesh = unit.buffer().ToShaderMesh();
            shader.set(smesh);
        } else if (unit instanceof Curve) {
            shader = new LineShader(gl);
            let multiLine = unit.buffer();
            shader.set(multiLine);
        } else if (unit instanceof Polyline) {
            shader = new LineShader(gl);
            let multiLine = MultiLine.fromPolyline(unit);
            shader.set(multiLine);
        } else if (unit instanceof Plane ) {
            shader = new LineShader(gl);
            let multiLine = MultiLine.fromPlane(unit);
            shader.set(multiLine);
        } else if (unit instanceof MultiLine) {
            shader = new LineShader(gl);
            shader.set(unit);
        } else {
            console.error("MultiRenderer cannot render: ", unit);
            return undefined;
        }

        this.shaders.set(key, shader);
        return shader;
    }
}