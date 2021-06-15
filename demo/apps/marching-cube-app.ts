// name:    obj-loader-app.ts
// author:  Jos Feenstra
// purpose: test statistic functionalties

import {
    App,
    DotShader,
    LineShader,
    MeshDebugShader,
    Camera,
    Plane,
    MultiLine,
    Vector3,
    ShaderMesh,
    IntCube,
    Perlin,
    InputState,
    Mesh,
    Ray,
    Matrix4,
    Cube,
    Domain3,
    Context,
} from "../../src/lib";

// TODO: MAKE IT 3D
// - 3D matrix (sounds stupid i know)
// - improve visuals slightly (no surface between cubes)
// - place at normal
// - block ray cast-> pick first

// TODO: MARCHING WAVE FUNCTION COLLAPSE
// - how to make interesting prototypes, but still use a bitmap data model?

export class MarchingCubeApp extends App {
    // renderinfo
    dotRenderer: DotShader;
    whiteLineRenderer: LineShader;
    greyLineRenderer: LineShader;
    redLineRenderer: LineShader;
    meshRenderer: MeshDebugShader;
    transMeshRenderer: MeshDebugShader;
    camera: Camera;

    // geo data
    plane: Plane = Plane.WorldXY();
    gridLarge!: MultiLine;
    gridSmall!: MultiLine;
    dots: Vector3[] = [];
    geo: ShaderMesh[] = [];
    mapGeo: ShaderMesh[] = [];
    cursorVisual?: MultiLine;

    // logic data
    size = 2;
    cellSize = 1;
    map!: IntCube;

    constructor(gl: WebGLRenderingContext, canvas: HTMLCanvasElement) {
        // setup render env
        super(gl);
        this.camera = new Camera(canvas);
        this.dotRenderer = new DotShader(gl, 4, [1, 0, 0, 1], false);
        this.whiteLineRenderer = new LineShader(gl, [1, 1, 1, 1]);
        this.greyLineRenderer = new LineShader(gl, [0.2, 0, 1, 0.5]);
        this.redLineRenderer = new LineShader(gl, [0.8, 0, 0, 1]);
        this.meshRenderer = new MeshDebugShader(gl, [0.9, 0.9, 0.9, 1], [0.7, 0.7, 0.7, 1]);
        this.transMeshRenderer = new MeshDebugShader(gl, [1, 1, 1, 0.1], [1, 1, 1, 0.1]);
    }

    start() {
        this.map = new IntCube(this.size, this.size, this.size);
        this.map.fill(0);

        let perlin = new Perlin();
        let scale = 0.2;
        this.map.map((value, i) => {
            let c = this.map.getCoords(i);

            let noise = perlin.noise(c.x * scale, c.y * scale, c.z * scale);

            if (noise > 0.6) {
                return 1;
            } else {
                return value;
            }
        });

        // console.log("done setting")

        // after change, buffer
        this.bufferMap();

        // console.log("done")

        this.gridLarge = MultiLine.fromGrid(this.plane, this.size, this.cellSize);
        this.gridSmall = MultiLine.fromGrid(this.plane, this.size * 10 - 1, this.cellSize / 10);

        // this.whiteLineRenderer.set(this.gl, this.gridLarge, DrawSpeed.StaticDraw);
        // this.greyLineRenderer.set(this.gl, this.gridSmall, DrawSpeed.StaticDraw);
    }

    update(state: InputState) {
        // move the camera with the mouse
        this.camera.update(state);

        this.updateCursor(state);
    }

    draw(gl: WebGLRenderingContext) {
        // get to-screen matrix
        const canvas = gl.canvas as HTMLCanvasElement;
        let matrix = this.camera.totalMatrix;
        let c = new Context(this.camera);

        // render the grid
        // this.greyLineRenderer.render(gl, matrix);
        // this.whiteLineRenderer.render(gl, matrix);

        // this.redLineRenderer.setAndRender(gl, matrix, this.cursorVisual!);

        // render the map
        // TODO create MeshArray
        this.meshRenderer.render(c);

        // render other things
        // for (let geo of this.geo) {
        //     this.transMeshRenderer.setAndRender(gl, matrix, geo);
        // }
    }

    addPreviewCube(point: Vector3) {
        let cubeCenter = this.mapToWorld(point);
        let cube = this.createCube(cubeCenter);
        this.geo.push(Mesh.fromCube(cube).ToShaderMesh());
    }

    flushPreviewCubes() {
        this.geo = [];
    }

    updateCursor(state: InputState) {
        // render mouse to world line
        let mouseRay = this.camera.getMouseWorldRay(state.canvas.width, state.canvas.height);

        // snap to world
        // let cursor = mouseRay.at(mouseRay.xPlane(this.plane));
        // let mapCursor = this.worldToMap(cursor);
        // let coord = this.mapToWorld(mapCursor);

        // place circle at cursor
        // let plane = this.plane.clone();
        // plane.matrix = plane.matrix.multiply(Matrix4.newTranslation(cursor.x, cursor.y, cursor.z));
        // this.cursorVisual = LineArray.fromCircle(new Circle3(plane, 0.1));

        // figure out which cube we are pointing to
        this.flushPreviewCubes();
        let [cubeID, cubeIDprevious] = this.voxelRaycast(mouseRay, 40);
        if (cubeID == -1) {
            // nothing else to do
            return;
        }

        // preview
        let cubeCursor = this.map.getCoords(cubeIDprevious);
        this.addPreviewCube(cubeCursor);

        // click
        if (state.mouseLeftPressed) {
            console.log("click");
            if (state.IsKeyDown(" ")) {
                if (this.map.data[cubeID] == 0) return;
                this.map.data[cubeID] = 0;
                this.bufferMap();
            } else if (this.map.data[cubeIDprevious] != 1) {
                this.map.data[cubeIDprevious] = 1;
                this.bufferMap();
            }
        }
    }

    // return the ID of the
    // A Fast Voxel Traversal Algorithm for Ray Tracing
    // Amanatides, Woo
    // Dept. of Computer Science
    voxelRaycast(ray: Ray, range: number): [number, number] {
        let startPoint = this.worldToMap(ray.origin);
        let voxelCenter = this.mapToWorld(startPoint);

        // integers
        let x = startPoint.x;
        let y = startPoint.y;
        let z = startPoint.z;

        let xprev = x;
        let yprev = y;
        let zprev = z;

        let stepX = ray.normal.x > 0 ? 1 : -1;
        let stepY = ray.normal.y > 0 ? 1 : -1;
        let stepZ = ray.normal.z > 0 ? 1 : -1;

        // floats
        let voxelsize = this.cellSize;
        let deltax = voxelsize / Math.abs(ray.normal.x);
        let deltay = voxelsize / Math.abs(ray.normal.y);
        let deltaz = voxelsize / Math.abs(ray.normal.z);

        // intit tx, ty, and tz, at their first intersection with corresponding plane
        voxelCenter.add(
            new Vector3((voxelsize / 2) * stepX, (voxelsize / 2) * stepY, (voxelsize / 2) * stepZ),
        );

        let move = Matrix4.newTranslation(voxelCenter.x, voxelCenter.y, voxelCenter.z);
        let xy = Plane.WorldXY();
        xy._matrix.multiply(move);
        let yz = Plane.WorldYZ();
        yz._matrix.multiply(move);
        let xz = Plane.WorldXZ();
        xz._matrix.multiply(move);

        let tx = ray.xPlane(yz);
        let ty = ray.xPlane(xz);
        let tz = ray.xPlane(xy);

        if (tx < 0 || ty < 0 || tz < 0) {
            console.log("something critical went wrong!");
            return [-1, -1];
        }

        // debug ray
        // let lineSets: LineArray[] = [ray.toLine(100), LineArray.fromPlane(xy), LineArray.fromPlane(yz), LineArray.fromPlane(xz)];
        // this.whiteLineRenderer.set(this.gl, LineArray.fromJoin(lineSets), DrawSpeed.StaticDraw);

        // console.log("voxel raycast initialized with:");
        // console.log("deltas: ", deltax, deltay, deltaz);
        // console.log("t's: ", tx, ty, tz);

        // start iterating
        // console.log("cast away!");
        // this.addPreviewCube(new Vector3(x,y,z));
        // console.log(x,y,z);
        for (let i = 0; i < range; i++) {
            // this.addPreviewCube(new Vector3(xprev,yprev,zprev));

            // if hit, return previous
            let value = this.map.tryGet(x, y, z);
            if (value == 1) {
                // console.log("found a cube after " + i + "steps...");
                // this.addPreviewCube(new Vector3(xprev,yprev,zprev));
                return [this.map.getIndex(x, y, z), this.map.getIndex(xprev, yprev, zprev)];
            } else {
                xprev = x;
                yprev = y;
                zprev = z;
            }

            // to the next cube!
            if (tx < ty && tx < tz) {
                // x
                tx += deltax;
                x += stepX;
            } else if (ty < tz) {
                // y
                ty += deltay;
                y += stepY;
            } else {
                // z
                tz += deltaz;
                z += stepZ;
            }
        }
        return [-1, -1];
    }

    // flush this.meshRenderer
    // turn this.map into this.mapGeo
    bufferMap() {
        console.log("buffering");
        let mapGeo: Mesh[] = [];
        this.map.iter((entry, index) => {
            if (entry == 1) {
                let mapCoord = this.map.getCoords(index);
                let coord = this.mapToWorld(mapCoord);
                let cube = this.createCube(coord);
                mapGeo.push(Mesh.fromCube(cube));
            }
        });
        this.meshRenderer.set(Mesh.fromJoin(mapGeo).ToShaderMesh());
    }

    worldToMap(coord: Vector3): Vector3 {
        let halfsize = this.size / 2 + this.cellSize / 2;
        return coord.added(new Vector3(halfsize, halfsize, halfsize)).floored();
    }

    mapToWorld(point: Vector3): Vector3 {
        let halfsize = this.size / 2;
        return point.added(new Vector3(-halfsize, -halfsize, -halfsize));
    }

    createCube(center: Vector3) {
        let hs = this.cellSize / 2;
        let move = Matrix4.newTranslation(center.x, center.y, center.z);
        let cube = new Cube(
            Plane.WorldXY().transform(move),
            Domain3.fromBounds(-hs, hs, -hs, hs, -hs, hs),
        );
        return cube;
    }
}
