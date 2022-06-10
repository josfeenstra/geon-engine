// name:    obj-loader-app.ts
// author:  Jos Feenstra
// purpose: drag an obj to the canvas, and view it on the web

import {
    App,
    DotShader,
    LineShader,
    MeshDebugShader,
    Camera,
    ShaderMesh,
    MultiLine,
    addDropFileEventListeners,
    InputState,
    MultiVector3,
    Vector3,
    loadTextFromFile,
    meshFromObj,
    Domain3,
    DrawSpeed,
    Context,
} from "../../src/lib";

export class ObjLoaderApp extends App {
    dotRenderer: DotShader;
    lineRenderer: LineShader;
    meshRenderer: MeshDebugShader;
    camera: Camera;

    obj?: ShaderMesh;
    renderable?: MultiLine;

    constructor(gl: WebGLRenderingContext) {
        super(gl);
        let canvas = gl.canvas as HTMLCanvasElement;
        this.dotRenderer = new DotShader(gl, 4, [0, 0, 1, 1], false);
        this.lineRenderer = new LineShader(gl, [0, 0, 1, 0.5]);
        this.meshRenderer = new MeshDebugShader(gl, [0, 0, 1, 0.25]);
        this.camera = new Camera(canvas);

        addDropFileEventListeners(canvas, processFiles.bind(this));
    }

    start() {
        // nothing
    }

    update(state: InputState) {
        // move the camera with the mouse
        this.camera.update(state);
    }

    draw(gl: WebGLRenderingContext) {
        // get to-screen matrix
        let c = new Context(this.camera);
        const canvas = gl.canvas as HTMLCanvasElement;
        let matrix = this.camera.totalMatrix;

        if (this.obj == undefined)
            this.dotRenderer.setAndRender(
                MultiVector3.fromList([new Vector3(0, 0, 0), new Vector3(1, 1, 1)]),
                c,
            );
        else {
            this.dotRenderer.setAndRender(this.obj!.mesh.verts, c);
            // this.meshRenderer.render(gl, matrix);
            this.lineRenderer.render(c);
        }
    }
}

async function processFiles(this: ObjLoaderApp, files: FileList) {
    // assume its 1 file, the obj file.
    let file = files[0];

    // see if we can build an correct obj from the files
    let objtext = await loadTextFromFile(file);
    this.obj = meshFromObj(objtext);
    this.renderable = MultiLine.fromMesh(this.obj);

    // scale down if too big.
    // NOTE: this could also be done using matrices. Figure that out!
    console.log("scaling...");

    let mesh = this.obj.mesh;
    let bounds = Domain3.fromInclude(this.obj.mesh.verts);
    let factor = 1 / bounds.size().largestValue();

    // TODO : one line these types of operations?
    // they will be quite common i think...
    let count = this.obj.mesh.verts.count;
    for (let i = 0; i < count; i++) {
        let vec = this.obj.mesh.verts.get(i);
        vec.scale(factor);
        this.obj.mesh.verts.set(i, vec);
    }

    // let objBounds = Domain3.fromInclude(this.obj.verts);
    // console.log(objBounds);

    // let factor = 100;
    // let smaller = Domain3.fromRadii(
    //     objBounds.x.size() / factor,
    //     objBounds.y.size() / factor,
    //     objBounds.z.size() / factor,
    // );
    // this.obj.verts = objBounds.remapAll(this.obj.verts, smaller);
    console.log("done!");

    // put the data into the render buffers.
    // this.meshRenderer.set(this.gl, this.obj.verts, this.obj.faces);
    this.lineRenderer.set(this.renderable, DrawSpeed.StaticDraw);
}
