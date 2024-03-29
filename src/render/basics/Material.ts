import { Color } from "../../image/Color";
import { Bitmap } from "../../lib";

export class Material {
    
    constructor(
        public ambient: Color,
        public diffuse: Color,
        public specular: Color,
        public occluded: Color,

        public specularDampner: number,
        public opacity: number, // 0: transparant, 1: opaque
        public texture?: Bitmap,
        public bumpmap?: Bitmap,
    ) {}

    static fromObjMtl() {
        throw new Error("TODO!!!");
    }

    static fromTexture(texture: Bitmap) {
        let mat = Material.neutral();
        mat.texture = texture;
        return mat;
    }

    static newPurple() {
        return new Material(
            Color.fromHex("#35006a")!,
            Color.fromHex("#ff0080")!,
            Color.fromHex("#513600")!,
            Color.fromHex("#1b0035")!,
            3.195,
            1,
        );
    }

    static grey() {
        return new Material(
            Color.fromHex("#1d1d1d")!,
            Color.fromHex("#4c4c4c")!,
            Color.fromHex("#f0f0f0")!,
            Color.fromHex("#1d1d1d")!,
            3.195,
            1,
        );
    }


    static neutral() {
        return new Material(
            Color.fromHex("#ffffff")!,
            Color.fromHex("#ffffff")!,
            Color.fromHex("#ffffff")!,
            Color.fromHex("#ffffff")!,
            3.195,
            1,
        );
    }

    static yellow() {
        return new Material(
            Color.fromHex("#fff25f")!,
            Color.fromHex("#fff25f")!,
            Color.fromHex("#fff25f")!,
            Color.fromHex("#fff25f")!,
            3.195,
            1,
        );
    }


    static default() {
        return new Material(
            Color.fromHex("#4f009d")!,
            Color.fromHex("#06ffff")!,
            Color.fromHex("#58593e")!,
            Color.fromHex("#1b0035")!,
            3.195,
            1,
        );
    }
}
