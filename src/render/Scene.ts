// purpose: wrapper around Camera, Lights, and Combo's
// Purpose: Experiment: a collection of renderers, things to render, and Camera's, as common as many 3d engines
// NOTE:    for now, just the camera lives in here
import { Camera } from "./Camera";
import { Light } from "./Light";

export class Scene {
    constructor(public camera: Camera, public light: Light[] = []) {}
}