// TODO
// - improve quadification: less triangles!
// - improve squarification: speed & equal sizes

import {
    App,
    Camera,
    ShadedMeshShader,
    Parameter,
    Graph,
    ShaderMesh,
    Vector3,
    UI,
    InputState,
    Matrix4,
    DrawSpeed,
    Mesh,
    Cube,
    Plane,
    Domain3,
    MeshDebugShader,
    VertIndex,
    EdgeIndex,
    EnumParameter,
    GraphDebugShader,
    Context,
    Vector2,
    GeonMath,
    Const,
} from "../../../src/lib";

import { Stopwatch } from "../../../src/system/stopwatch";
import { constructMeshFromSphereGraph, createGraph } from "./spherical";
import { graphToMultiMesh } from "../icosahedron-app";
import { averageEdgeLength, laPlacian, quadification, squarification } from "./spherical";
import { StaticMeshCombo } from "../../../src/combo/mesh-combo";

export class SphericalLandingApp extends App {
    c: Context;

    rotate!: Parameter;
    inner!: Parameter;
    subCount!: Parameter;
    quadSubCount!: Parameter;
    liftType!: EnumParameter;
    randomEdges!: Parameter;

    radius = 0.1;

    graph!: Graph;
    average!: number;
    smooth!: Parameter;
    smoothlimit = 0;
    cca?: number;

    worlds: StaticMeshCombo[] = [];

    lerpCameraPos!: Vector3;
    lerpCameraOri!: Vector3;
    lerpColorState = 0;
    mousePos = new Vector2(0, 0);
    lerpSpeed = 0.1;

    color = [0, 0, 0, 0.8];
    linecolor = [0.3, 0.3, 0.3, 1];

    camStates = new Map<string, number[]>([
        ["side", [-0.413470964, 1.49448, 0.83, -1, 2.379899, 0.751]],
        ["low-side", [-0.41302839, 1.49265395, 0.83134874, -1, 1.37494473, -1.830813444]],
        ["bottom", [-0.3182952, 1.1018537, 1.11999998, -1, 1.31959045, -0.3189964]],
        ["overview", [0, 0, -2.5999999999999885, -1, 0, 0]],
        ["top", [-1.32173, -0.64986, 0.14, -1, 2.4, -2.04]],
        ["inside", [0, 0, 0, -1, 0, 0]],
    ]);

    constructor(gl: WebGLRenderingContext) {
        super(gl, "Multiple Layers of spherical geometry");

        let canvas = gl.canvas as HTMLCanvasElement;
        this.c = new Context(new Camera(canvas, 1, false, false));

        // this.c.camera.pos = new Vector3(
        //     -0.41347096487880547,
        //     1.4944804848730606,
        //     0.8300000000000006,
        // );
        // this.c.camera.set(-1, 2.379899, 0.751);
        // this.c.camera.set(-4.08, 1.24, -0.71);
    }

    ui(ui: UI) {
        let reset = () => {
            // this.rotate.set(0);
            this.start();
        };

        this.rotate = new Parameter("rotate", 1, 0, 1, 1);
        this.randomEdges = new Parameter("delete edges", 1, 0, 1, 1);
        this.smooth = new Parameter("smooth", 0, 0, 1, 1);
        this.subCount = new Parameter("sub count", 2, 0, 4, 1);
        this.quadSubCount = new Parameter("sub count quad", 1, 0, 2, 1);
        this.liftType = EnumParameter.new("lift type", 1, ["none", "sphere", "buggy"]);

        ui.hide();
        ui.addBooleanParameter(this.rotate);
        ui.addBooleanParameter(this.randomEdges, reset);
        ui.addBooleanParameter(this.smooth);
        ui.addParameter(this.subCount, reset);
        ui.addParameter(this.quadSubCount, reset);
        ui.addParameter(this.liftType, reset);
        ui.addButton("recalculate", reset);
    }

    start() {
        // set some values
        this.radius = 1;
        this.smoothlimit = 0;

        // create the graph
        this.graph = createGraph(
            1,
            this.subCount.get(),
            this.quadSubCount.get(),
            this.randomEdges.get(),
        );

        // 5 | convert
        this.average = averageEdgeLength(this.graph);

        this.bufferWorld();
    }

    bufferWorld() {
        this.worlds = [];
        let levels = [0, 0.1, 0.2, 0.3];
        let freqs = [0.7, 0.5, 0.3];

        for (let i = 0; i < 3; i++) {
            let bot = levels[i];
            let top = levels[i + 1];
            let freq = freqs[i];

            let mc = StaticMeshCombo.new(this.gl);
            mc.set(constructMeshFromSphereGraph(this.graph, this.radius, bot, top, freq));
            this.worlds.push(mc);
        }
    }

    update(state: InputState) {
        this.c.camera.update(state);

        // update rotation
        let speedb = 0.00007 * state.tick;
        let scalar = 1 + 4 * Math.log10(1 + this.mousePos.disTo(state.mousePos));
        this.mousePos = state.mousePos;
        speedb *= scalar;
        this.lerpSpeed = GeonMath.lerp(this.lerpSpeed, speedb, 0.025);

        // rotate mesh
        if (this.rotate.get() == 1) {
            // rotate
            let alpha = this.lerpSpeed;
            let rotx = Matrix4.newXRotation(alpha);
            let roty = Matrix4.newYRotation(alpha);
            let rot = rotx.multiply(roty);
            this.worlds[0].buffered.position.multiply(rot);
            this.worlds[1].buffered.position.multiply(Matrix4.newXRotation(-alpha));
            this.worlds[2].buffered.position.multiply(Matrix4.newZRotation(-alpha));
        }

        // update color
        this.updateColors(state);
        this.updateCamPos(state);

        // commit
        for (let world of this.worlds) {
            world.commit();
        }
    }

    goto = "";
    lerpPosState = 0;
    updateCamPos(inputState: InputState) {
        let canvas = this.gl.canvas as HTMLCanvasElement;
        let goto = canvas.getAttribute("data-goto");

        // quit if we dont need to do anything
        if (!goto || goto == this.goto) {
            return;
        }

        // quit if no valid input
        let gotoState = this.camStates.get(goto);
        if (!gotoState) {
            // console.log("invalid input!");
            return;
        }

        // get the difference between current position
        let doweneedtolerp = false;
        let currState = this.c.camera.getState()!;
        let diffState = gotoState.map((v, i) => {
            let diff = v - currState[i];
            if (Math.abs(diff) > Const.TOLERANCE * 50) {
                doweneedtolerp = true;
            }
            return diff;
        });

        // quit if
        if (!doweneedtolerp) {
            this.goto = goto;
            console.log("arrival!");
            return; // we have arrived at our desintation!
        }

        // lerp!
        this.goto = ""; // this is important: put yourself in limbo: so that back and forth movements are possible
        const step = 0.0012 * inputState.tick;
        let camState = lerpList(currState, gotoState, step);
        this.c.camera.setState(camState);
    }

    updateColors(state: InputState) {
        let canvas = this.gl.canvas as HTMLCanvasElement;
        const step = 0.0005 * state.tick;
        let filled = canvas.getAttribute("data-filled");

        if (filled == "1" && this.lerpColorState < 1) {
            // fill it
            this.lerpColorState += step;
        } else if (filled == "0" && this.lerpColorState > 0) {
            // empty it
            this.lerpColorState -= step;
        } else {
            return;
        }
        let fade1 = GeonMath.smooth(this.lerpColorState);
        let fade2 = GeonMath.smooth(Math.min(this.lerpColorState * 2, 1));

        this.worlds.forEach((w) => {
            w.color = lerpList(this.color, [0, 0, 0, 0], 1 - fade1);
            w.linecolor = lerpList(this.linecolor, [0, 0, 0, 0], 1 - fade2);
        });
        this.lerpSpeed *= fade1;
    }

    draw(gl: WebGLRenderingContext) {
        if (this.lerpColorState == 0) {
            return;
        }
        for (let world of this.worlds) {
            world.render(this.c);
        }
    }
}

function lerpList(a: number[], b: number[], delta: number): number[] {
    return a.map((v, i) => {
        return v * (1 - delta) + b[i] * delta;
    });
}
