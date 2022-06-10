// Name:    scene.ts
// Author:  Jos Feenstra
// NOTE:    not used yet 
import { Vector3 } from "../math/vector";

export class Light {
    private constructor(
        public pos: Vector3,
        public color: number[],
        public spot: boolean,
        public dir: Vector3,
    ) {}

    static new(pos: Vector3, color = [1, 1, 1, 1]) {
        return new Light(pos, color, false, Vector3.zero());
    }
}
