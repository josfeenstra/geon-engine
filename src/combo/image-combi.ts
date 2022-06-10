import { Plane } from "../geo/plane";
import { Rectangle3 } from "../geo/rectangle";
import { GeonImage } from "../img/Image";
import { Domain2 } from "../math/domain";
import { Vector3 } from "../math/vector";
import { Mesh } from "../mesh/mesh";
import { ShaderMesh } from "../mesh/shader-mesh";
import { TextureMeshShader } from "../shaders/texture-mesh-shader";
import { Combi, Combo } from "./combo";

export class ImageCombi extends Combi<GeonImage, ShaderMesh, TextureMeshShader> {
    private constructor(gl: WebGLRenderingContext) {
        super(gl, [], TextureMeshShader.new);
    }

    static new(gl: WebGLRenderingContext): ImageCombi {
        return new ImageCombi(gl);
    }

    buffer() {
        // i was having trouble rendering images... this is a workaround:
        // convert the this.images[] list into the this.imageMeshes list. then render that with the normal renderer
        this.buffered = [];

        let size = 256;
        let accHeight = 0;
        this.state.forEach((s, i) => {
            let height = s.height;
            let width = s.width;

            let rec = new Rectangle3(
                Plane.fromPVV(new Vector3(0, 0, 0), new Vector3(0, 0, 1), new Vector3(-1, 0, 0)),
                Domain2.fromBounds(10, 10 + width, accHeight, accHeight + height),
            );
            let mesh = Mesh.fromRect(rec);
            mesh.setTexture(s.resize(size, size).toImageData()); // note: webgl can only work with 2^x * 512 images
            this.buffered.push(mesh);

            accHeight += height + 10;
        });
    }
}
