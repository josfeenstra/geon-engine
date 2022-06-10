// // name:    billboard-renderer.ts
// // author:  Jos Feenstra
// // purpose: Renderer images as billboards.

// import { GeonImage, MultiVector3, MultiVector2, Renderer, DrawSpeed, Context } from "../lib";

// // mooi font om te gebruiken
// // https://datagoblin.itch.io/monogram

// type RenderPackage = {
//     texture: GeonImage;
//     dots: MultiVector3;
//     textureDots: MultiVector2;
// };

// // this is just a template for copy-pasting
// export class TemplateRenderer extends Renderer<RenderPackage> {
//     constructor(gl: WebGLRenderingContext) {
//         let vs = "";
//         let fs = "";

//         super(gl, vs, fs);
//     }

//     static new(gl: WebGLRenderingContext): TemplateRenderer {
//         return new TemplateRenderer(gl);
//     }

//     set(p: RenderPackage, speed: DrawSpeed) {
//         // TODO
//     }

//     render(context: Context) {
//         // TODO
//     }

//     setAndRender(pack: RenderPackage, context: Context) {
//         this.set(pack, DrawSpeed.StaticDraw);
//         this.render(context);
//     }
// }

// // export class TextRenderer {
// //     // TODO

// //     // use the billboard renderer to render series of ascii characters,
// //     // by using standard positions of certain font images.

// //     br: BillBoardRenderer;

// //     // todo horizontal justification
// //     // todo vertical justification

// //     constructor(gl: WebGLRenderingContext) {
// //         this.br = new BillBoardRenderer(gl);
// //     }

// //     set(strings: string[], locations: Vector3Array) {
// //         if (strings.length != locations.count()) {
// //             console.warn("couldnt set TextRenderer: strings not equal to locations...");
// //         }
// //         let length = strings.length;

// //         // TODO: set a whole bunch of stuff
// //     }

// //     render() {}
// // }
