// Name:    index.ts
// Author:  Jos Feenstra
// Purpose: Entry point

import { Core, FpsCounter, Shader, SwapApp } from "../src/lib";

import { DotApp3 } from "./apps/dot-app3";
import { SphericalTwoApp } from "./apps/spherical/spherical-two-app";
import { GeometryApp } from "./apps/geometry-app";
import { IcosahedronApp } from "./apps/icosahedron-app";
import { MeshInspectorApp } from "./apps/mesh-inspector-app";
import { ObjLoaderApp } from "./apps/obj-loader-app";
import { SphericalOneApp } from "./apps/spherical/spherical-one-app";
import { SphericalThreeApp } from "./apps/spherical/spherical-three-app";
import { LeastSquaresApp } from "./apps/math/least-squares-app";
import { BezierApp } from "./apps/math/bezier-app";
import { SurfaceApp } from "./apps/math/surface-app";
import { PerlinApp } from "./apps/math/perlin-app";
import { LoftApp } from "./apps/math/loft-app";
import { StatApp } from "./apps/old/stat-app";
import { SplineApp } from "./apps/math/spline.app";
import { PerlinLinesApp } from "./apps/math/perlin-lines-app";
import { BezierCpApp } from "./apps/math/bezier-cp-app";
import { SurfaceCpApp } from "./apps/math/surface-cp-app";
import { MultiRendererApp } from "./apps/util/renderer-app";

var core: Core;

function main() {
    // get references of all items on the canvas
    let canvas = document.getElementById("canvas")! as HTMLCanvasElement;
    let ui = document.getElementById("interface") as HTMLDivElement;

    // init core
    let gl = Shader.initWebglContext(canvas);
    core = new Core(canvas, gl, ui);

    // init swap app
    let appCollection = [
        MultiRendererApp,
        PerlinApp,
        SurfaceApp,
        BezierApp,
        BezierCpApp,
        SurfaceCpApp,
        SplineApp,
        LoftApp,
        SphericalOneApp,
        SphericalTwoApp,
        SphericalThreeApp,
        GeometryApp,
        IcosahedronApp,
        DotApp3,
        LeastSquaresApp,
        MeshInspectorApp,
        ObjLoaderApp,
    ];

    let swapApp = new SwapApp(gl, core, appCollection);
    core.addApp(swapApp);

    // check if the hash matches one of the app names, if so, switch to that app. if not, goto the default start app.
    let defaultIndex = 0;
    swapApp.swapFromUrl(location.hash, defaultIndex);

    // time 
    let accumulated = 0;
    let counter = FpsCounter.new();
    
    // infinite loop
    function loop(elapsed: number) {
        let dt = elapsed - accumulated;
        accumulated = elapsed;

        counter._update(dt);
        document.title = "fps: " + counter.getFps();

        core.update(dt);
        core.draw();
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

window.addEventListener("load", main, false);
