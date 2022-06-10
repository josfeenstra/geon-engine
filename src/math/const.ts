// name:    const.ts
// author:  Jos Feenstra
// purpose: Certain math constances
// todo:    These are somewhat like the settings of the entire application. This could be expanded upon (json's, in-app functionalitiy)

export class Const {
    static TOLERANCE = 0.0001; // tolerance used for determining if 1 value is the same as some other value, relatively speaking
    static TOL_SQUARED = Const.TOLERANCE ** 2;

    static MAX_U16 = 65536;

    // ----- Line Render Settings -----

    static PLANE_RENDER_LINECOUNT = 9;
    static PLANE_RENDER_LINEDISTANCE = 0.3;

    static CIRCLE_SEGMENTS = 100;
    static BEZIER_SEGMENTS = 100;

    static IsRouglyZero(value: number) {
        return Math.abs(value) < this.TOLERANCE;
    }
}
