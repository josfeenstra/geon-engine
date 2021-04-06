// name:    obj-loader-app.ts
// author:  Jos Feenstra
// purpose: drag an obj to the canvas, and view it on the web

import {
    App,
    DotRenderer3,
    LineRenderer,
    SimpleMeshRenderer,
    Camera,
    Renderable,
    LineArray,
    addDropFileEventListeners,
    InputState,
    Vector3Array,
    Vector3,
    loadTextFromFile,
    meshFromObj,
    Domain3,
    DrawSpeed,
} from "../../src/lib";

export class ObjLoaderApp extends App {
    dotRenderer: DotRenderer3;
    lineRenderer: LineRenderer;
    meshRenderer: SimpleMeshRenderer;
    camera: Camera;

    obj?: Renderable;
    renderable?: LineArray;

    constructor(gl: WebGLRenderingContext) {
        super(gl);
        let canvas = gl.canvas as HTMLCanvasElement;
        this.dotRenderer = new DotRenderer3(gl, 4, [0, 0, 1, 1], false);
        this.lineRenderer = new LineRenderer(gl, [0, 0, 1, 0.5]);
        this.meshRenderer = new SimpleMeshRenderer(gl, [0, 0, 1, 0.25]);
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
        const canvas = gl.canvas as HTMLCanvasElement;
        let matrix = this.camera.totalMatrix;

        if (this.obj == undefined)
            this.dotRenderer.setAndRender(
                gl,
                matrix,
                Vector3Array.fromList([new Vector3(0, 0, 0), new Vector3(1, 1, 1)]),
            );
        else {
            this.dotRenderer.setAndRender(gl, matrix, this.obj!.mesh.verts);
            // this.meshRenderer.render(gl, matrix);
            this.lineRenderer.render(gl, matrix);
        }
    }
}

async function processFiles(this: ObjLoaderApp, files: FileList) {
    // assume its 1 file, the obj file.
    let file = files[0];

    // see if we can build an correct obj from the files
    let objtext = await loadTextFromFile(file);
    this.obj = meshFromObj(objtext);
    this.renderable = LineArray.fromMesh(this.obj);

    // scale down if too big.
    // NOTE: this could also be done using matrices. Figure that out!
    console.log("scaling...");

    let mesh = this.obj.mesh;
    let bounds = Domain3.fromInclude(this.obj.mesh.verts);
    let factor = 1 / bounds.size().largestValue();

    // TODO : one line these types of operations?
    // they will be quite common i think...
    let count = this.obj.mesh.verts.count();
    for (let i = 0; i < count; i++) {
        let vec = this.obj.mesh.verts.getVector(i);
        vec.scale(factor);
        this.obj.mesh.verts.setVector(i, vec);
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
    this.lineRenderer.set(this.gl, this.renderable, DrawSpeed.StaticDraw);
}