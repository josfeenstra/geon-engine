// author : Jos Feenstra
// purpose : test with Renderers, Domains & Vectors

// import { Rectangle2 } from "../geo/rectangle";
// import { GeonImage } from "../img/Image";
// import { Domain, Domain2, Domain3 } from "../math/domain";
// import { Matrix3 } from "../math/matrix";
// import { Vector3 } from "../math/vector";
// import { RectangleRenderer } from "../render/rectangle-renderer";
// import { InputState } from "../system/input-state"
// import { App } from "./app"

// export class RectangleApp extends App {

//     recs: Rectangle2[] = [];
//     dirs: Vector3[] = [];

//     bounds: Domain3;
//     renderer: ImageRenderer;
//     tex: GeonImage;

//     // unique constructors
//     constructor(gl: WebGLRenderingContext) {
//         super(gl);
//         this.bounds = Domain3.fromBounds(0, 300, 0, 300, 0, 500);
//         this.renderer = new ImageRenderer(gl)
//         this.tex = new GeonImage(20, 20).fillEvery(randomPixelColor);
//     }

//     start() {
//         // additional setup of state
//         let normrange = 5;
//         let count = 10;
//         const normSpace = Domain3.fromBounds(-normrange, normrange, -normrange, normrange, -normrange, normrange);

//         for (let i = 0 ; i < count; i++) {

//             let loc = this.bounds.elevate(Vector3.fromRandom());
//             let mat = Matrix3.newIdentity().translate(loc.toVector2());
//             let domain = Domain2.fromBounds(-100, 100, -100, 100);

//             this.recs.push(new Rectangle2(mat, domain));
//             this.dirs.push(normSpace.elevate(Vector3.fromRandom()));
//         }
//     }

//     update(state: InputState) {
//         for (let i = 0 ; i < this.recs.length; i++) {

//             // these 'should' be pointers, but check this
//             let rec = this.recs[i];
//             let dir = this.dirs[i];

//             // bounce of the edges
//             let center = rec.center();
//             if (!this.bounds.x.includes(center.x))
//                 dir.x = -dir.x
//             if (!this.bounds.y.includes(center.y))
//                 dir.y = -dir.y
//             // if (!this.bounds.z.includes(center.z))
//             //     dir.z = -dir.z

//             // move & rotate
//             rec.pose = rec.pose.rotate(0.01);
//             rec.pose = Matrix3.newTranslation(dir.x, dir.y).multiply(rec.pose);

//             if (state.IsKeyPressed("q"))
//             {
//                 console.log(rec.center().toString());
//             }
//         }
//     }

//     draw(gl: WebGLRenderingContext) {
//         for (const rec of this.recs) {

//             this.renderer.setAndRender(gl, rec, this.tex.toImageData());
//         }
//     }
// }

function randomPixelColor(alpha: number = 255): number[] {
    let pixel: number[] = [];
    pixel.push(Math.round(Math.random() * 255));
    pixel.push(Math.round(Math.random() * 255));
    pixel.push(Math.round(Math.random() * 255));
    pixel.push(alpha);
    return pixel;
}
